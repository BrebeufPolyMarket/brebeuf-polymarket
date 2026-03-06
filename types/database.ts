import type { HouseId } from "@/lib/houses";

export type UserStatus = "pending" | "active" | "banned";
export type MarketStatus = "active" | "closed" | "resolved" | "cancelled";
export type MarketType = "binary" | "multi";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          avatar_url: string | null;
          house: HouseId;
          house_confirmed: boolean;
          bio: string | null;
          grade_year: number | null;
          favourite_subject: string | null;
          points_balance: number;
          lifetime_won: number;
          total_wagered: number;
          win_count: number;
          loss_count: number;
          status: UserStatus;
          is_admin: boolean;
          referral_code: string | null;
          referred_by: string | null;
          daily_login_streak: number;
          last_login_date: string | null;
          created_at: string;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          id: string;
          email: string;
          username: string;
          house: HouseId;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      houses: {
        Row: {
          id: HouseId;
          display_name: string;
          colour_hex: string;
          total_points: number;
          member_count: number;
          rank: number | null;
          previous_rank: number | null;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["houses"]["Row"];
        Update: Partial<Database["public"]["Tables"]["houses"]["Row"]>;
      };
      markets: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          type: MarketType;
          status: MarketStatus;
          is_featured: boolean;
          close_time: string;
          resolved_at: string | null;
          resolution_value: string | null;
          liquidity_param: number;
          total_volume: number;
          trader_count: number;
          fee_rate: number;
          fee_pool: number;
          created_at: string;
          created_by: string;
          resolution_criteria: string;
        };
        Insert: Partial<Database["public"]["Tables"]["markets"]["Row"]> & {
          title: string;
          description: string;
          category: string;
          type: MarketType;
          close_time: string;
          created_by: string;
          resolution_criteria: string;
        };
        Update: Partial<Database["public"]["Tables"]["markets"]["Row"]>;
      };
      market_options: {
        Row: {
          id: string;
          market_id: string;
          label: string;
          shares_outstanding: number;
          probability: number;
        };
        Insert: Partial<Database["public"]["Tables"]["market_options"]["Row"]> & {
          market_id: string;
          label: string;
        };
        Update: Partial<Database["public"]["Tables"]["market_options"]["Row"]>;
      };
      positions: {
        Row: {
          id: string;
          user_id: string;
          market_id: string;
          option_id: string;
          shares: number;
          avg_price: number;
          current_value: number;
          realized_pnl: number;
          status: "open" | "closed";
          opened_at: string;
          closed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["positions"]["Row"]> & {
          user_id: string;
          market_id: string;
          option_id: string;
          shares: number;
          avg_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["positions"]["Row"]>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          market_id: string | null;
          option_id: string | null;
          type:
            | "buy"
            | "sell"
            | "payout"
            | "refund"
            | "signup_bonus"
            | "daily_bonus"
            | "referral_bonus"
            | "house_lead_bonus"
            | "fee_contribution"
            | "manual_top_up";
          shares: number | null;
          price_per_share: number | null;
          points_delta: number;
          balance_after: number;
          house_at_tx: HouseId | null;
          client_tx_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]> & {
          user_id: string;
          type: Database["public"]["Tables"]["transactions"]["Row"]["type"];
          points_delta: number;
          balance_after: number;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
      };
    };
  };
}
