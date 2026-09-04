/**
 * Types de la base, générés depuis le schéma réel.
 *
 * ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
 * Régénérer : node --env-file=.env.local scripts/generer-types-db.mjs
 *
 * Les montants sont des bigint en Postgres. PostgREST les sérialise en number,
 * ce qui reste exact jusqu'à 2^53 — très au-delà de ce qu'un patrimoine
 * personnel atteint en centimes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      asset_holders: {
        Row: {
          asset_id: string
          holder_id: string
          quote_part: number
        }
        Insert: {
          asset_id: string
          holder_id: string
          quote_part: number
        }
        Update: {
          asset_id?: string
          holder_id?: string
          quote_part?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_holders_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_holders_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "holders"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_snapshots: {
        Row: {
          asset_id: string
          date: string
          id: number
          valeur_cents: number
        }
        Insert: {
          asset_id: string
          date: string
          id?: number
          valeur_cents: number
        }
        Update: {
          asset_id?: string
          date?: string
          id?: number
          valeur_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_snapshots_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_transactions: {
        Row: {
          asset_id: string
          created_at: string
          date: string
          devise: string
          frais_courtage_cents: number
          id: string
          montant_brut_cents: number
          precompte_cents: number
          precompte_retenu_a_la_source: boolean
          prix_unitaire_cents: number | null
          quantite: number | null
          reference_externe: string | null
          sens: Database["public"]["Enums"]["sens_transaction_titre"]
          tob_cents: number
          tob_retenue_a_la_source: boolean
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          date: string
          devise?: string
          frais_courtage_cents?: number
          id?: string
          montant_brut_cents: number
          precompte_cents?: number
          precompte_retenu_a_la_source?: boolean
          prix_unitaire_cents?: number | null
          quantite?: number | null
          reference_externe?: string | null
          sens: Database["public"]["Enums"]["sens_transaction_titre"]
          tob_cents?: number
          tob_retenue_a_la_source?: boolean
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          date?: string
          devise?: string
          frais_courtage_cents?: number
          id?: string
          montant_brut_cents?: number
          precompte_cents?: number
          precompte_retenu_a_la_source?: boolean
          prix_unitaire_cents?: number | null
          quantite?: number | null
          reference_externe?: string | null
          sens?: Database["public"]["Enums"]["sens_transaction_titre"]
          tob_cents?: number
          tob_retenue_a_la_source?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          archive: boolean
          capitalisant: boolean | null
          classe: Database["public"]["Enums"]["classe_actif"]
          compte_epargne_reglemente: boolean | null
          connection_id: string | null
          created_at: string
          date_acquisition: string | null
          devise: string
          est_manuel: boolean
          id: string
          inscrit_en_belgique: boolean | null
          institution_id: string | null
          isin: string | null
          nom: string
          part_obligataire: number | null
          precompte_immobilier_annuel_cents: number | null
          prime_fidelite: number | null
          prix_acquisition_cents: number | null
          quantite: number | null
          revenu_cadastral_cents: number | null
          solde_cents: number | null
          taux_base: number | null
          ticker: string | null
          updated_at: string
          usage_bien: Database["public"]["Enums"]["usage_bien"] | null
          user_id: string
          valeur_reference_2025_cents: number | null
          valeur_unitaire_cents: number | null
        }
        Insert: {
          archive?: boolean
          capitalisant?: boolean | null
          classe: Database["public"]["Enums"]["classe_actif"]
          compte_epargne_reglemente?: boolean | null
          connection_id?: string | null
          created_at?: string
          date_acquisition?: string | null
          devise?: string
          est_manuel?: boolean
          id?: string
          inscrit_en_belgique?: boolean | null
          institution_id?: string | null
          isin?: string | null
          nom: string
          part_obligataire?: number | null
          precompte_immobilier_annuel_cents?: number | null
          prime_fidelite?: number | null
          prix_acquisition_cents?: number | null
          quantite?: number | null
          revenu_cadastral_cents?: number | null
          solde_cents?: number | null
          taux_base?: number | null
          ticker?: string | null
          updated_at?: string
          usage_bien?: Database["public"]["Enums"]["usage_bien"] | null
          user_id: string
          valeur_reference_2025_cents?: number | null
          valeur_unitaire_cents?: number | null
        }
        Update: {
          archive?: boolean
          capitalisant?: boolean | null
          classe?: Database["public"]["Enums"]["classe_actif"]
          compte_epargne_reglemente?: boolean | null
          connection_id?: string | null
          created_at?: string
          date_acquisition?: string | null
          devise?: string
          est_manuel?: boolean
          id?: string
          inscrit_en_belgique?: boolean | null
          institution_id?: string | null
          isin?: string | null
          nom?: string
          part_obligataire?: number | null
          precompte_immobilier_annuel_cents?: number | null
          prime_fidelite?: number | null
          prix_acquisition_cents?: number | null
          quantite?: number | null
          revenu_cadastral_cents?: number | null
          solde_cents?: number | null
          taux_base?: number | null
          ticker?: string | null
          updated_at?: string
          usage_bien?: Database["public"]["Enums"]["usage_bien"] | null
          user_id?: string
          valeur_reference_2025_cents?: number | null
          valeur_unitaire_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: number
          ip: unknown
          ressource: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          ip?: unknown
          ressource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          ip?: unknown
          ressource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_connections: {
        Row: {
          access_token_chiffre: string | null
          consentement_expire_le: string | null
          created_at: string
          derniere_sync_le: string | null
          id: string
          institution_id: string | null
          provider: string
          provider_account_id: string | null
          statut: Database["public"]["Enums"]["connexion_statut"]
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_chiffre?: string | null
          consentement_expire_le?: string | null
          created_at?: string
          derniere_sync_le?: string | null
          id?: string
          institution_id?: string | null
          provider: string
          provider_account_id?: string | null
          statut?: Database["public"]["Enums"]["connexion_statut"]
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_chiffre?: string | null
          consentement_expire_le?: string | null
          created_at?: string
          derniere_sync_le?: string | null
          id?: string
          institution_id?: string | null
          provider?: string
          provider_account_id?: string | null
          statut?: Database["public"]["Enums"]["connexion_statut"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          couleur: string | null
          created_at: string
          icone: string | null
          id: string
          nom: string
          parent_id: string | null
          type: Database["public"]["Enums"]["type_categorie"]
          user_id: string | null
        }
        Insert: {
          couleur?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nom: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["type_categorie"]
          user_id?: string | null
        }
        Update: {
          couleur?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nom?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["type_categorie"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categorisation_rules: {
        Row: {
          category_id: string
          created_at: string
          id: string
          motif: string
          priorite: number
          user_id: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          motif: string
          priorite?: number
          user_id?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          motif?: string
          priorite?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorisation_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorisation_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_assets: {
        Row: {
          asset_id: string
          goal_id: string
        }
        Insert: {
          asset_id: string
          goal_id: string
        }
        Update: {
          asset_id?: string
          goal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_assets_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          echeance: string | null
          id: string
          montant_cible_cents: number | null
          nom: string
          parametres: Json
          type: Database["public"]["Enums"]["type_objectif"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          echeance?: string | null
          id?: string
          montant_cible_cents?: number | null
          nom: string
          parametres?: Json
          type?: Database["public"]["Enums"]["type_objectif"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          echeance?: string | null
          id?: string
          montant_cible_cents?: number | null
          nom?: string
          parametres?: Json
          type?: Database["public"]["Enums"]["type_objectif"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      holders: {
        Row: {
          created_at: string
          est_utilisateur: boolean
          id: string
          nom: string
          user_id: string
        }
        Insert: {
          created_at?: string
          est_utilisateur?: boolean
          id?: string
          nom: string
          user_id: string
        }
        Update: {
          created_at?: string
          est_utilisateur?: boolean
          id?: string
          nom?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          bic: string | null
          created_at: string
          id: string
          logo_url: string | null
          nom: string
          pays: string
          provider_ref: string | null
        }
        Insert: {
          bic?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nom: string
          pays?: string
          provider_ref?: string | null
        }
        Update: {
          bic?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nom?: string
          pays?: string
          provider_ref?: string | null
        }
        Relationships: []
      }
      liabilities: {
        Row: {
          asset_id: string | null
          capital_initial_cents: number
          capital_restant_cents: number
          created_at: string
          date_debut: string
          duree_mois: number
          id: string
          mensualite_cents: number
          nom: string
          taux_annuel: number
          taux_fixe: boolean
          type: Database["public"]["Enums"]["type_passif"]
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          capital_initial_cents: number
          capital_restant_cents: number
          created_at?: string
          date_debut: string
          duree_mois: number
          id?: string
          mensualite_cents: number
          nom: string
          taux_annuel: number
          taux_fixe?: boolean
          type: Database["public"]["Enums"]["type_passif"]
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string | null
          capital_initial_cents?: number
          capital_restant_cents?: number
          created_at?: string
          date_debut?: string
          duree_mois?: number
          id?: string
          mensualite_cents?: number
          nom?: string
          taux_annuel?: number
          taux_fixe?: boolean
          type?: Database["public"]["Enums"]["type_passif"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liabilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_snapshots: {
        Row: {
          actifs_cents: number
          actifs_quote_part_cents: number | null
          date: string
          id: number
          impot_latent_cents: number | null
          net_cents: number
          net_quote_part_cents: number | null
          passifs_cents: number
          passifs_quote_part_cents: number | null
          user_id: string
        }
        Insert: {
          actifs_cents: number
          actifs_quote_part_cents?: number | null
          date: string
          id?: number
          impot_latent_cents?: number | null
          net_cents: number
          net_quote_part_cents?: number | null
          passifs_cents: number
          passifs_quote_part_cents?: number | null
          user_id: string
        }
        Update: {
          actifs_cents?: number
          actifs_quote_part_cents?: number | null
          date?: string
          id?: number
          impot_latent_cents?: number | null
          net_cents?: number
          net_quote_part_cents?: number | null
          passifs_cents?: number
          passifs_quote_part_cents?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          additionnels_communaux: number | null
          commune: string | null
          created_at: string
          date_naissance: string | null
          devise: string
          id: string
          locale: string
          prenom: string | null
          region: Database["public"]["Enums"]["region_fiscale"]
          situation_familiale: string | null
          statut: Database["public"]["Enums"]["statut_pro"]
          updated_at: string
        }
        Insert: {
          additionnels_communaux?: number | null
          commune?: string | null
          created_at?: string
          date_naissance?: string | null
          devise?: string
          id: string
          locale?: string
          prenom?: string | null
          region?: Database["public"]["Enums"]["region_fiscale"]
          situation_familiale?: string | null
          statut?: Database["public"]["Enums"]["statut_pro"]
          updated_at?: string
        }
        Update: {
          additionnels_communaux?: number | null
          commune?: string | null
          created_at?: string
          date_naissance?: string | null
          devise?: string
          id?: string
          locale?: string
          prenom?: string | null
          region?: Database["public"]["Enums"]["region_fiscale"]
          situation_familiale?: string | null
          statut?: Database["public"]["Enums"]["statut_pro"]
          updated_at?: string
        }
        Relationships: []
      }
      simulations: {
        Row: {
          created_at: string
          id: string
          parametres: Json
          partage_token: string | null
          resultat: Json | null
          type: Database["public"]["Enums"]["type_simulation"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          parametres: Json
          partage_token?: string | null
          resultat?: Json | null
          type: Database["public"]["Enums"]["type_simulation"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          parametres?: Json
          partage_token?: string | null
          resultat?: Json | null
          type?: Database["public"]["Enums"]["type_simulation"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_events: {
        Row: {
          annee_fiscale: number
          asset_id: string | null
          asset_transaction_id: string | null
          base_cents: number
          created_at: string
          date: string
          detail: Json
          id: string
          impot_cents: number
          type: Database["public"]["Enums"]["type_evenement_fiscal"]
          user_id: string
        }
        Insert: {
          annee_fiscale: number
          asset_id?: string | null
          asset_transaction_id?: string | null
          base_cents: number
          created_at?: string
          date: string
          detail?: Json
          id?: string
          impot_cents: number
          type: Database["public"]["Enums"]["type_evenement_fiscal"]
          user_id: string
        }
        Update: {
          annee_fiscale?: number
          asset_id?: string | null
          asset_transaction_id?: string | null
          base_cents?: number
          created_at?: string
          date?: string
          detail?: Json
          id?: string
          impot_cents?: number
          type?: Database["public"]["Enums"]["type_evenement_fiscal"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_events_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_events_asset_transaction_id_fkey"
            columns: ["asset_transaction_id"]
            isOneToOne: false
            referencedRelation: "asset_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_parameters: {
        Row: {
          annee: number
          cle: string
          created_at: string
          id: string
          libelle: string
          region: Database["public"]["Enums"]["region_fiscale"] | null
          source_url: string
          unite: Database["public"]["Enums"]["unite_parametre"]
          updated_at: string
          valeur: number
          verifie: boolean
          verifie_le: string
        }
        Insert: {
          annee: number
          cle: string
          created_at?: string
          id?: string
          libelle: string
          region?: Database["public"]["Enums"]["region_fiscale"] | null
          source_url: string
          unite: Database["public"]["Enums"]["unite_parametre"]
          updated_at?: string
          valeur: number
          verifie?: boolean
          verifie_le: string
        }
        Update: {
          annee?: number
          cle?: string
          created_at?: string
          id?: string
          libelle?: string
          region?: Database["public"]["Enums"]["region_fiscale"] | null
          source_url?: string
          unite?: Database["public"]["Enums"]["unite_parametre"]
          updated_at?: string
          valeur?: number
          verifie?: boolean
          verifie_le?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          asset_id: string | null
          category_id: string | null
          contrepartie: string | null
          created_at: string
          date: string
          exclue_du_budget: boolean
          id: string
          libelle: string
          montant_cents: number
          recurrente: boolean
          reference_externe: string | null
          source: Database["public"]["Enums"]["source_transaction"]
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          category_id?: string | null
          contrepartie?: string | null
          created_at?: string
          date: string
          exclue_du_budget?: boolean
          id?: string
          libelle: string
          montant_cents: number
          recurrente?: boolean
          reference_externe?: string | null
          source?: Database["public"]["Enums"]["source_transaction"]
          user_id: string
        }
        Update: {
          asset_id?: string | null
          category_id?: string | null
          contrepartie?: string | null
          created_at?: string
          date?: string
          exclue_du_budget?: boolean
          id?: string
          libelle?: string
          montant_cents?: number
          recurrente?: boolean
          reference_externe?: string | null
          source?: Database["public"]["Enums"]["source_transaction"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      classe_actif:
        | "compte_courant"
        | "compte_epargne"
        | "compte_titres"
        | "etf"
        | "action"
        | "obligation"
        | "fonds"
        | "crypto"
        | "immobilier"
        | "assurance_groupe"
        | "epargne_pension"
        | "branche21"
        | "branche23"
        | "parts_societe"
        | "creance"
        | "metaux"
        | "autre"
      connexion_statut: "active" | "expiree" | "erreur" | "revoquee"
      region_fiscale: "wallonie" | "bruxelles" | "flandre"
      sens_transaction_titre:
        | "achat"
        | "vente"
        | "dividende"
        | "coupon"
        | "split"
        | "frais"
      source_transaction: "psd2" | "coda" | "csv" | "manuel"
      statut_pro:
        | "salarie"
        | "independant_complementaire"
        | "independant_principal"
        | "etudiant"
        | "autre"
      type_categorie: "revenu" | "depense" | "investissement" | "transfert"
      type_evenement_fiscal:
        | "plus_value"
        | "moins_value"
        | "dividende"
        | "interet"
        | "tob"
        | "precompte"
        | "reynders"
      type_objectif: "libre" | "precaution" | "apport_immo"
      type_passif:
        | "credit_hypothecaire"
        | "pret_temperament"
        | "pret_prive"
        | "leasing"
        | "autre"
      type_simulation:
        | "patrimoine"
        | "interets"
        | "emprunt"
        | "locatif"
        | "independant"
      unite_parametre: "pourcent" | "eur" | "coefficient" | "annees"
      usage_bien: "propre" | "locatif_prive" | "locatif_pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      classe_actif: [
        "compte_courant",
        "compte_epargne",
        "compte_titres",
        "etf",
        "action",
        "obligation",
        "fonds",
        "crypto",
        "immobilier",
        "assurance_groupe",
        "epargne_pension",
        "branche21",
        "branche23",
        "parts_societe",
        "creance",
        "metaux",
        "autre",
      ],
      connexion_statut: ["active", "expiree", "erreur", "revoquee"],
      region_fiscale: ["wallonie", "bruxelles", "flandre"],
      sens_transaction_titre: [
        "achat",
        "vente",
        "dividende",
        "coupon",
        "split",
        "frais",
      ],
      source_transaction: ["psd2", "coda", "csv", "manuel"],
      statut_pro: [
        "salarie",
        "independant_complementaire",
        "independant_principal",
        "etudiant",
        "autre",
      ],
      type_categorie: ["revenu", "depense", "investissement", "transfert"],
      type_evenement_fiscal: [
        "plus_value",
        "moins_value",
        "dividende",
        "interet",
        "tob",
        "precompte",
        "reynders",
      ],
      type_objectif: ["libre", "precaution", "apport_immo"],
      type_passif: [
        "credit_hypothecaire",
        "pret_temperament",
        "pret_prive",
        "leasing",
        "autre",
      ],
      type_simulation: [
        "patrimoine",
        "interets",
        "emprunt",
        "locatif",
        "independant",
      ],
      unite_parametre: ["pourcent", "eur", "coefficient", "annees"],
      usage_bien: ["propre", "locatif_prive", "locatif_pro"],
    },
  },
} as const
