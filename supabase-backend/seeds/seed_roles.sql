INSERT INTO public.roles (name)
VALUES
    ('employee'),
    ('manager'),
    ('admin'),
    ('ops')
ON CONFLICT (name) DO NOTHING;