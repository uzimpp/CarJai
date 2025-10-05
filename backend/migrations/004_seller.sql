CREATE TABLE sellers (
    id INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    display_name VARCHAR(50) NOT NULL,
    about VARCHAR(200),
    map_link TEXT,
    CONSTRAINT sellers_display_name_not_blank CHECK (trim(display_name) <> ''),
    CONSTRAINT chk_display_name_length CHECK (length(display_name) <= 50),
    CONSTRAINT chk_about_length CHECK (length(about) <= 200)
);

CREATE TABLE seller_contacts (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers (id) ON DELETE CASCADE,
    contact_type VARCHAR(20) NOT NULL, -- e.g. 'phone','email','line','facebook','instagram','website'
    value TEXT NOT NULL, -- phone, @handle, or URL
    label VARCHAR(80),
    CONSTRAINT ux_seller_contact UNIQUE (
        seller_id,
        contact_type,
        value
    )
);
