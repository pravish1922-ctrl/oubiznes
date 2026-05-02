-- Run in Supabase SQL Editor (one-time setup)
create table if not exists regulatory_rates (
  id             uuid default gen_random_uuid() primary key,
  rate_name      text not null unique,
  rate_value     text not null,
  effective_date date,
  source_url     text,
  last_verified  timestamp default now(),
  last_changed   timestamp,
  notes          text
);
alter table regulatory_rates enable row level security;
create policy "Allow service read"  on regulatory_rates for select using (true);
create policy "Allow service write" on regulatory_rates for all    using (true);

insert into regulatory_rates (rate_name, rate_value, effective_date, source_url, notes) values
('vat_standard_rate',           '15',      '2025-10-01', 'https://mra.mu/vatregulations',         'Finance Act 2025'),
('vat_registration_threshold',  '3000000', '2025-10-01', 'https://mra.mu/vatregulations',         'Rs 3 million per year'),
('paye_band_1_rate',            '0',       '2025-07-01', 'https://mra.mu/paye',                   'First Rs 500,000/year'),
('paye_band_2_rate',            '10',      '2025-07-01', 'https://mra.mu/paye',                   'Next Rs 500,000/year'),
('paye_band_3_rate',            '20',      '2025-07-01', 'https://mra.mu/paye',                   'Above Rs 1,000,000/year'),
('csg_employee_low',            '1.5',     '2025-07-01', 'https://mra.mu/csg',                    'Basic <= Rs 50,000'),
('csg_employee_high',           '3',       '2025-07-01', 'https://mra.mu/csg',                    'Basic > Rs 50,000'),
('csg_employer_low',            '3',       '2025-07-01', 'https://mra.mu/csg',                    'Basic <= Rs 50,000'),
('csg_employer_high',           '6',       '2025-07-01', 'https://mra.mu/csg',                    'Basic > Rs 50,000'),
('nsf_employee_rate',           '1',       '2025-07-01', 'https://mra.mu/nsf',                    'Capped ~Rs 28,570/month'),
('nsf_employer_rate',           '2.5',     '2025-07-01', 'https://mra.mu/nsf',                    'Capped'),
('hrdc_levy_rate',              '1.5',     '2025-07-01', 'https://mra.mu/hrdc',                   'Employer only'),
('minimum_wage',                '16500',   '2025-07-01', 'https://labour.govmu.org',              'Rs 16,500/month')
on conflict (rate_name) do nothing;
