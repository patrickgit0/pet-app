
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "adoption_request_events": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"id": number,"note": string | null,"request_id": string,"status": Database["public"]['Enums']["request_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: never,"note"?: string | null,"request_id": string,"status": Database["public"]['Enums']["request_status"]
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: never,"note"?: string | null,"request_id"?: string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "adoption_request_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adoption_request_events_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "adoption_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"adoption_requests": {
                  Row: {
                    "adopter_id": string,"animal_id": string,"answers": NonNullable<Json>,"approved_at": string | null,"created_at": string,"id": string,"ngo_id": string,"rejection_reason": string | null,"status": Database["public"]['Enums']["request_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "adopter_id": string,"animal_id": string,"answers"?: NonNullable<Json>,"approved_at"?: string | null,"created_at"?: string,"id"?: string,"ngo_id": string,"rejection_reason"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"updated_at"?: string
                  }
                  Update: {
                    "adopter_id"?: string,"animal_id"?: string,"answers"?: NonNullable<Json>,"approved_at"?: string | null,"created_at"?: string,"id"?: string,"ngo_id"?: string,"rejection_reason"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "adoption_requests_adopter_id_fkey"
      columns: ["adopter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adoption_requests_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adoption_requests_ngo_id_fkey"
      columns: ["ngo_id"]
isOneToOne: false
      referencedRelation: "ngos"
      referencedColumns: ["id"]
    }
                  ]
                },"adoptions": {
                  Row: {
                    "adopted_at": string,"adopter_id": string,"animal_id": string,"id": string,"ngo_id": string,"request_id": string,"return_reason": string | null,"returned_at": string | null,"status": Database["public"]['Enums']["adoption_status"],"term_accepted_at": string | null,"term_version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "adopted_at"?: string,"adopter_id": string,"animal_id": string,"id"?: string,"ngo_id": string,"request_id": string,"return_reason"?: string | null,"returned_at"?: string | null,"status"?: Database["public"]['Enums']["adoption_status"],"term_accepted_at"?: string | null,"term_version"?: string
                  }
                  Update: {
                    "adopted_at"?: string,"adopter_id"?: string,"animal_id"?: string,"id"?: string,"ngo_id"?: string,"request_id"?: string,"return_reason"?: string | null,"returned_at"?: string | null,"status"?: Database["public"]['Enums']["adoption_status"],"term_accepted_at"?: string | null,"term_version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "adoptions_adopter_id_fkey"
      columns: ["adopter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adoptions_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adoptions_ngo_id_fkey"
      columns: ["ngo_id"]
isOneToOne: false
      referencedRelation: "ngos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adoptions_request_id_fkey"
      columns: ["request_id"]
isOneToOne: true
      referencedRelation: "adoption_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"animal_photos": {
                  Row: {
                    "animal_id": string,"created_at": string,"id": string,"position": number,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id": string,"created_at"?: string,"id"?: string,"position"?: number,"storage_path": string
                  }
                  Update: {
                    "animal_id"?: string,"created_at"?: string,"id"?: string,"position"?: number,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "animal_photos_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    }
                  ]
                },"animals": {
                  Row: {
                    "birth_date_estimate": string | null,"breed": string,"code": string,"created_at": string,"description": string | null,"dewormed": boolean | null,"energy": Database["public"]['Enums']["energy_level"] | null,"good_for_apartment": boolean | null,"good_with_cats": boolean | null,"good_with_dogs": boolean | null,"good_with_kids": boolean | null,"id": string,"location": unknown,"name": string,"neutered": boolean | null,"ngo_id": string,"published_at": string | null,"sex": Database["public"]['Enums']["animal_sex"],"size": Database["public"]['Enums']["animal_size"],"special_needs": string | null,"species": Database["public"]['Enums']["species"],"status": Database["public"]['Enums']["animal_status"],"updated_at": string,"vaccinated": boolean | null,"vaccination_card_path": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "birth_date_estimate"?: string | null,"breed"?: string,"code"?: string,"created_at"?: string,"description"?: string | null,"dewormed"?: boolean | null,"energy"?: Database["public"]['Enums']["energy_level"] | null,"good_for_apartment"?: boolean | null,"good_with_cats"?: boolean | null,"good_with_dogs"?: boolean | null,"good_with_kids"?: boolean | null,"id"?: string,"location"?: unknown,"name": string,"neutered"?: boolean | null,"ngo_id": string,"published_at"?: string | null,"sex": Database["public"]['Enums']["animal_sex"],"size": Database["public"]['Enums']["animal_size"],"special_needs"?: string | null,"species": Database["public"]['Enums']["species"],"status"?: Database["public"]['Enums']["animal_status"],"updated_at"?: string,"vaccinated"?: boolean | null,"vaccination_card_path"?: string | null
                  }
                  Update: {
                    "birth_date_estimate"?: string | null,"breed"?: string,"code"?: string,"created_at"?: string,"description"?: string | null,"dewormed"?: boolean | null,"energy"?: Database["public"]['Enums']["energy_level"] | null,"good_for_apartment"?: boolean | null,"good_with_cats"?: boolean | null,"good_with_dogs"?: boolean | null,"good_with_kids"?: boolean | null,"id"?: string,"location"?: unknown,"name"?: string,"neutered"?: boolean | null,"ngo_id"?: string,"published_at"?: string | null,"sex"?: Database["public"]['Enums']["animal_sex"],"size"?: Database["public"]['Enums']["animal_size"],"special_needs"?: string | null,"species"?: Database["public"]['Enums']["species"],"status"?: Database["public"]['Enums']["animal_status"],"updated_at"?: string,"vaccinated"?: boolean | null,"vaccination_card_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "animals_ngo_id_fkey"
      columns: ["ngo_id"]
isOneToOne: false
      referencedRelation: "ngos"
      referencedColumns: ["id"]
    }
                  ]
                },"checkins": {
                  Row: {
                    "adoption_id": string,"answered_at": string | null,"answers": Json | null,"due_at": string,"due_day": number,"id": string,"needs_help": boolean,"ngo_followed_up_at": string | null,"photo_paths": (string)[],"status": Database["public"]['Enums']["checkin_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "adoption_id": string,"answered_at"?: string | null,"answers"?: Json | null,"due_at": string,"due_day": number,"id"?: string,"needs_help"?: boolean,"ngo_followed_up_at"?: string | null,"photo_paths"?: (string)[],"status"?: Database["public"]['Enums']["checkin_status"]
                  }
                  Update: {
                    "adoption_id"?: string,"answered_at"?: string | null,"answers"?: Json | null,"due_at"?: string,"due_day"?: number,"id"?: string,"needs_help"?: boolean,"ngo_followed_up_at"?: string | null,"photo_paths"?: (string)[],"status"?: Database["public"]['Enums']["checkin_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "checkins_adoption_id_fkey"
      columns: ["adoption_id"]
isOneToOne: false
      referencedRelation: "adoptions"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "adopter_id": string,"animal_id": string,"assigned_member_id": string | null,"blocked_at": string | null,"created_at": string,"id": string,"last_message_at": string | null,"ngo_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "adopter_id": string,"animal_id": string,"assigned_member_id"?: string | null,"blocked_at"?: string | null,"created_at"?: string,"id"?: string,"last_message_at"?: string | null,"ngo_id": string
                  }
                  Update: {
                    "adopter_id"?: string,"animal_id"?: string,"assigned_member_id"?: string | null,"blocked_at"?: string | null,"created_at"?: string,"id"?: string,"last_message_at"?: string | null,"ngo_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_adopter_id_fkey"
      columns: ["adopter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_assigned_member_id_fkey"
      columns: ["assigned_member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_ngo_id_fkey"
      columns: ["ngo_id"]
isOneToOne: false
      referencedRelation: "ngos"
      referencedColumns: ["id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "animal_id": string,"created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id": string,"created_at"?: string,"user_id": string
                  }
                  Update: {
                    "animal_id"?: string,"created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "attachment_path": string | null,"body": string | null,"conversation_id": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["message_kind"],"read_at": string | null,"sender_id": string,"visit_at": string | null,"visit_confirmed_at": string | null,"visit_place": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attachment_path"?: string | null,"body"?: string | null,"conversation_id": string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["message_kind"],"read_at"?: string | null,"sender_id": string,"visit_at"?: string | null,"visit_confirmed_at"?: string | null,"visit_place"?: string | null
                  }
                  Update: {
                    "attachment_path"?: string | null,"body"?: string | null,"conversation_id"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["message_kind"],"read_at"?: string | null,"sender_id"?: string,"visit_at"?: string | null,"visit_confirmed_at"?: string | null,"visit_place"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"ngo_members": {
                  Row: {
                    "created_at": string,"ngo_id": string,"role": Database["public"]['Enums']["ngo_member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ngo_id": string,"role"?: Database["public"]['Enums']["ngo_member_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"ngo_id"?: string,"role"?: Database["public"]['Enums']["ngo_member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ngo_members_ngo_id_fkey"
      columns: ["ngo_id"]
isOneToOne: false
      referencedRelation: "ngos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ngo_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"ngos": {
                  Row: {
                    "address_text": string | null,"city": string,"cnpj": string,"completed_adoptions": number,"created_at": string,"description": string | null,"email": string | null,"id": string,"instagram": string | null,"location": unknown,"logo_url": string | null,"median_response_minutes": number | null,"name": string,"neighborhood": string | null,"opening_hours": Json | null,"phone": string | null,"pix_key": string | null,"rating": number | null,"rating_count": number,"slug": string,"state": string,"updated_at": string,"verified_at": string | null,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address_text"?: string | null,"city": string,"cnpj": string,"completed_adoptions"?: number,"created_at"?: string,"description"?: string | null,"email"?: string | null,"id"?: string,"instagram"?: string | null,"location": unknown,"logo_url"?: string | null,"median_response_minutes"?: number | null,"name": string,"neighborhood"?: string | null,"opening_hours"?: Json | null,"phone"?: string | null,"pix_key"?: string | null,"rating"?: number | null,"rating_count"?: number,"slug": string,"state": string,"updated_at"?: string,"verified_at"?: string | null,"whatsapp"?: string | null
                  }
                  Update: {
                    "address_text"?: string | null,"city"?: string,"cnpj"?: string,"completed_adoptions"?: number,"created_at"?: string,"description"?: string | null,"email"?: string | null,"id"?: string,"instagram"?: string | null,"location"?: unknown,"logo_url"?: string | null,"median_response_minutes"?: number | null,"name"?: string,"neighborhood"?: string | null,"opening_hours"?: Json | null,"phone"?: string | null,"pix_key"?: string | null,"rating"?: number | null,"rating_count"?: number,"slug"?: string,"state"?: string,"updated_at"?: string,"verified_at"?: string | null,"whatsapp"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"notifications": {
                  Row: {
                    "created_at": string,"data": NonNullable<Json>,"emailed_at": string | null,"id": string,"kind": string,"link": string,"read_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"data"?: NonNullable<Json>,"emailed_at"?: string | null,"id"?: string,"kind": string,"link": string,"read_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"data"?: NonNullable<Json>,"emailed_at"?: string | null,"id"?: string,"kind"?: string,"link"?: string,"read_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_private": {
                  Row: {
                    "cep": string | null,"complement": string | null,"cpf": string | null,"cpf_verified_at": string | null,"id": string,"lgpd_consent_at": string | null,"phone": string | null,"phone_verified_at": string | null,"street": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cep"?: string | null,"complement"?: string | null,"cpf"?: string | null,"cpf_verified_at"?: string | null,"id": string,"lgpd_consent_at"?: string | null,"phone"?: string | null,"phone_verified_at"?: string | null,"street"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "cep"?: string | null,"complement"?: string | null,"cpf"?: string | null,"cpf_verified_at"?: string | null,"id"?: string,"lgpd_consent_at"?: string | null,"phone"?: string | null,"phone_verified_at"?: string | null,"street"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_private_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"city": string | null,"created_at": string,"full_name": string,"has_children": boolean | null,"has_yard": boolean | null,"home_type": Database["public"]['Enums']["home_type"] | null,"id": string,"location": unknown,"neighborhood": string | null,"other_pets": string | null,"profile_completed_at": string | null,"role": Database["public"]['Enums']["user_role"],"routine_notes": string | null,"state": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"city"?: string | null,"created_at"?: string,"full_name": string,"has_children"?: boolean | null,"has_yard"?: boolean | null,"home_type"?: Database["public"]['Enums']["home_type"] | null,"id": string,"location"?: unknown,"neighborhood"?: string | null,"other_pets"?: string | null,"profile_completed_at"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"routine_notes"?: string | null,"state"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"city"?: string | null,"created_at"?: string,"full_name"?: string,"has_children"?: boolean | null,"has_yard"?: boolean | null,"home_type"?: Database["public"]['Enums']["home_type"] | null,"id"?: string,"location"?: unknown,"neighborhood"?: string | null,"other_pets"?: string | null,"profile_completed_at"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"routine_notes"?: string | null,"state"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"id": string,"reason": string,"reporter_id": string,"resolved_at": string | null,"target_id": string,"target_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"reason": string,"reporter_id": string,"resolved_at"?: string | null,"target_id": string,"target_type": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"reason"?: string,"reporter_id"?: string,"resolved_at"?: string | null,"target_id"?: string,"target_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "adopter_id": string,"adoption_id": string,"comment": string | null,"created_at": string,"hidden_at": string | null,"id": string,"ngo_id": string,"stars": number
                  }
                  ComputedFields: never
                  Insert: {
                    "adopter_id": string,"adoption_id": string,"comment"?: string | null,"created_at"?: string,"hidden_at"?: string | null,"id"?: string,"ngo_id": string,"stars": number
                  }
                  Update: {
                    "adopter_id"?: string,"adoption_id"?: string,"comment"?: string | null,"created_at"?: string,"hidden_at"?: string | null,"id"?: string,"ngo_id"?: string,"stars"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_adopter_id_fkey"
      columns: ["adopter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_adoption_id_fkey"
      columns: ["adoption_id"]
isOneToOne: true
      referencedRelation: "adoptions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_ngo_id_fkey"
      columns: ["ngo_id"]
isOneToOne: false
      referencedRelation: "ngos"
      referencedColumns: ["id"]
    }
                  ]
                },"saved_searches": {
                  Row: {
                    "alert_enabled": boolean,"center": unknown,"created_at": string,"filters": NonNullable<Json>,"id": string,"last_alerted_at": string | null,"name": string | null,"radius_km": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alert_enabled"?: boolean,"center": unknown,"created_at"?: string,"filters"?: NonNullable<Json>,"id"?: string,"last_alerted_at"?: string | null,"name"?: string | null,"radius_km"?: number,"user_id": string
                  }
                  Update: {
                    "alert_enabled"?: boolean,"center"?: unknown,"created_at"?: string,"filters"?: NonNullable<Json>,"id"?: string,"last_alerted_at"?: string | null,"name"?: string | null,"radius_km"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_searches_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_adoption_term":
{ Args: { "p_adoption_id": string }; Returns: undefined
                           },
"admin_dashboard":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_list_users":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_query"?: string,"p_role"?: Database["public"]['Enums']["user_role"] }; Returns: {
              "adoptions": number,"city": string,"created_at": string,"email": string,"full_name": string,"id": string,"last_sign_in_at": string,"neighborhood": string,"ngo_name": string,"phone_verified": boolean,"profile_complete": boolean,"requests": number,"role": Database["public"]['Enums']["user_role"],"total_count": number
            }[]
                           },
"admin_resolve_report":
{ Args: { "p_report_id": string }; Returns: undefined
                           },
"admin_set_animal_status":
{ Args: { "p_animal_id": string,"p_status": Database["public"]['Enums']["animal_status"] }; Returns: undefined
                           },
"admin_set_user_role":
{ Args: { "p_role": Database["public"]['Enums']["user_role"],"p_user_id": string }; Returns: undefined
                           },
"admin_user_detail":
{ Args: { "p_user_id": string }; Returns: Json
                           },
"admin_verify_ngo":
{ Args: { "p_ngo_id": string,"p_verified": boolean }; Returns: undefined
                           },
"answer_checkin":
{ Args: { "p_answers": Json,"p_checkin_id": string,"p_needs_help"?: boolean,"p_photo_paths"?: (string)[] }; Returns: undefined
                           },
"cancel_adoption_request":
{ Args: { "p_request_id": string }; Returns: undefined
                           },
"complete_adoption":
{ Args: { "p_checkin_days"?: (number)[],"p_request_id": string }; Returns: string
                           },
"complete_profile":
{ Args: { "p_cep": string,"p_city": string,"p_complement": string,"p_cpf": string,"p_has_children": boolean,"p_has_yard": boolean,"p_home_type": Database["public"]['Enums']["home_type"],"p_lat": number,"p_lgpd_consent": boolean,"p_lng": number,"p_neighborhood": string,"p_other_pets": string,"p_phone": string,"p_state": string,"p_street": string }; Returns: undefined
                           },
"create_ngo":
{ Args: { "p_address_text"?: string,"p_city": string,"p_cnpj": string,"p_description"?: string,"p_email"?: string,"p_lat": number,"p_lng": number,"p_name": string,"p_neighborhood"?: string,"p_phone"?: string,"p_slug": string,"p_state": string }; Returns: string
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"get_adopter_contact":
{ Args: { "p_request_id": string }; Returns: {
              "cep": string,"city": string,"complement": string,"full_name": string,"neighborhood": string,"phone": string,"state": string,"street": string
            }[]
                           },
"get_candidate_summary":
{ Args: { "p_request_id": string }; Returns: {
              "adopter_id": string,"city": string,"cpf_verified": boolean,"distance_km": number,"full_name": string,"has_children": boolean,"has_yard": boolean,"home_type": Database["public"]['Enums']["home_type"],"neighborhood": string,"other_pets": string,"phone": string,"phone_verified": boolean
            }[]
                           },
"get_my_location":
{ Args: Record<PropertyKey, never>; Returns: {
              "lat": number,"lng": number
            }[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_candidate_of_my_ngo":
{ Args: { "p_profile_id": string }; Returns: boolean
                           },
"is_conversation_participant":
{ Args: { "p_conversation_id": string }; Returns: boolean
                           },
"is_my_requested_animal":
{ Args: { "p_animal_id": string }; Returns: boolean
                           },
"is_ngo_member":
{ Args: { "p_ngo_id": string }; Returns: boolean
                           },
"is_ngo_owner":
{ Args: { "p_ngo_id": string }; Returns: boolean
                           },
"is_profile_complete":
{ Args: { "p_uid"?: string }; Returns: boolean
                           },
"is_valid_cpf":
{ Args: { "p_cpf": string }; Returns: boolean
                           },
"mark_checkin_followed_up":
{ Args: { "p_checkin_id": string }; Returns: undefined
                           },
"notify":
{ Args: { "p_data": Json,"p_kind": string,"p_link": string,"p_user": string }; Returns: undefined
                           },
"notify_due_checkins":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"notify_ngo":
{ Args: { "p_data": Json,"p_except"?: string,"p_kind": string,"p_link": string,"p_ngo": string }; Returns: undefined
                           },
"recompute_ngo_rating":
{ Args: { "p_ngo_id": string }; Returns: number
                           },
"register_return":
{ Args: { "p_adoption_id": string,"p_reason": string }; Returns: undefined
                           },
"request_adoption":
{ Args: { "p_animal_id": string,"p_answers"?: Json }; Returns: string
                           },
"review_ngo":
{ Args: { "p_adoption_id": string,"p_comment"?: string,"p_stars": number }; Returns: undefined
                           },
"run_daily_jobs":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"search_animals":
{ Args: { "p_age_groups"?: (string)[],"p_good_for_apartment"?: boolean,"p_good_with_cats"?: boolean,"p_good_with_dogs"?: boolean,"p_good_with_kids"?: boolean,"p_lat": number,"p_limit"?: number,"p_lng": number,"p_neutered"?: boolean,"p_offset"?: number,"p_query"?: string,"p_radius_km"?: number,"p_sexes"?: (Database["public"]['Enums']["animal_sex"])[],"p_sizes"?: (Database["public"]['Enums']["animal_size"])[],"p_sort"?: string,"p_species"?: (Database["public"]['Enums']["species"])[],"p_verified_only"?: boolean }; Returns: {
              "age_months": number,"approx_lat": number,"approx_lng": number,"breed": string,"code": string,"cover_path": string,"distance_km": number,"good_with_kids": boolean,"id": string,"name": string,"neutered": boolean,"ngo_id": string,"ngo_name": string,"ngo_rating": number,"ngo_slug": string,"ngo_verified": boolean,"published_at": string,"sex": Database["public"]['Enums']["animal_sex"],"size": Database["public"]['Enums']["animal_size"],"species": Database["public"]['Enums']["species"],"status": Database["public"]['Enums']["animal_status"],"total_count": number,"vaccinated": boolean
            }[]
                           },
"set_request_status":
{ Args: { "p_reason"?: string,"p_request_id": string,"p_status": Database["public"]['Enums']["request_status"] }; Returns: undefined
                           },
"start_conversation":
{ Args: { "p_animal_id": string }; Returns: string
                           },
"sync_phone_verification":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "adoption_status": "active"|"returned","animal_sex": "male"|"female","animal_size": "small"|"medium"|"large","animal_status": "draft"|"available"|"reserved"|"adopted"|"archived","checkin_status": "pending"|"answered"|"late","energy_level": "low"|"medium"|"high","home_type": "house"|"apartment"|"farm","message_kind": "text"|"image"|"visit_proposal"|"system","ngo_member_role": "owner"|"volunteer","request_status": "sent"|"reviewing"|"visit_scheduled"|"approved"|"rejected"|"cancelled","species": "dog"|"cat"|"other","user_role": "adopter"|"ngo_member"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "adoption_status": ["active", "returned"],"animal_sex": ["male", "female"],"animal_size": ["small", "medium", "large"],"animal_status": ["draft", "available", "reserved", "adopted", "archived"],"checkin_status": ["pending", "answered", "late"],"energy_level": ["low", "medium", "high"],"home_type": ["house", "apartment", "farm"],"message_kind": ["text", "image", "visit_proposal", "system"],"ngo_member_role": ["owner", "volunteer"],"request_status": ["sent", "reviewing", "visit_scheduled", "approved", "rejected", "cancelled"],"species": ["dog", "cat", "other"],"user_role": ["adopter", "ngo_member", "admin"]
          }
        }
} as const
