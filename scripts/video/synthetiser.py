"""
Synthétise la narration d'un guide, scène par scène, avec les temps de chaque mot.

Voix neurales Microsoft via edge-tts — gratuites, et il en existe deux en
français de Belgique (Charline, Gérard). Chaque scène donne un MP3 et la
liste de ses mots avec leur instant de départ et leur durée : c'est ce qui
permet aux sous-titres de suivre la voix mot à mot.

Usage : python scripts/video/synthetiser.py matelas-de-securite-belgique
Sortie : video/public/<slug>/scene-<n>.mp3 et video/public/<slug>/timings.json
"""
import asyncio
import json
import pathlib
import sys

import edge_tts

RACINE = pathlib.Path(__file__).resolve().parents[2]


async def synthetiser(slug: str) -> None:
    narration = json.loads((RACINE / "video" / "narrations" / f"{slug}.json").read_text(encoding="utf-8"))
    dossier = RACINE / "video" / "public" / slug
    dossier.mkdir(parents=True, exist_ok=True)

    voix = narration.get("voix", "fr-BE-CharlineNeural")
    scenes = []
    for i, scene in enumerate(narration["scenes"], start=1):
        com = edge_tts.Communicate(scene["texte"], voix, rate="-4%", boundary="WordBoundary")
        mots = []
        with open(dossier / f"scene-{i}.mp3", "wb") as f:
            async for chunk in com.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    mots.append(
                        {
                            "mot": chunk["text"],
                            "debut": round(chunk["offset"] / 1e7, 3),
                            "duree": round(chunk["duration"] / 1e7, 3),
                        }
                    )
        # La scène dure jusqu'à la fin du dernier mot, plus un souffle.
        fin = (mots[-1]["debut"] + mots[-1]["duree"] + 0.6) if mots else 2.0
        scenes.append(
            {
                "index": i,
                "texte": scene["texte"],
                "motsCles": scene.get("motsCles", []),
                "requete": scene.get("requete", ""),
                "audio": f"scene-{i}.mp3",
                "dureeSecondes": round(fin, 3),
                "mots": mots,
            }
        )
        print(f"  scène {i} : {len(mots)} mots, {fin:.1f} s")

    (dossier / "timings.json").write_text(
        json.dumps({"slug": slug, "titre": narration["titre"], "voix": voix, "scenes": scenes}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    total = sum(s["dureeSecondes"] for s in scenes)
    print(f"{slug} : {len(scenes)} scènes, {total:.0f} s au total")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage : python scripts/video/synthetiser.py <slug>")
        sys.exit(1)
    asyncio.run(synthetiser(sys.argv[1]))
