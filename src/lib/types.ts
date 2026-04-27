export interface Zone {
    id: string;
    zone_name: string;
    origin_country: string | null;
    destination_country: string | null;
    tier: 'domestic' | 'regional' | 'international';
    rate_multiplier: number;
    flat_surcharge: number;
    standard_days: number;
    express_days: number;
    overnight_days: number;
    is_active: boolean;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}
