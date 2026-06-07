-- REHOME: UPDATE IMAGES SCRIPT
-- Jalankan script ini di Supabase SQL Editor.
-- Script ini akan secara otomatis memberikan gambar yang bervariasi dari folder lokal Anda
-- kepada semua produk yang saat ini gambarnya masih kosong (sama semua/menggunakan fallback kursi).

WITH numbered_products AS (
  SELECT id, row_number() over (order by created_at desc) as rn
  FROM public.products
  WHERE image_url IS NULL
),
images AS (
  SELECT * FROM (VALUES
    (1, 'assets/figma-export/268b036d427a5127a614793cadef99464ad05a75.png'),
    (2, 'assets/figma-export/4b23d195922fdb515f0b4b3df7f21d1516d601d8.png'),
    (3, 'assets/figma-export/585f92e3662d379261eb92c36f8bc58c7e846362.png'),
    (4, 'assets/figma-export/70e1f26af8d8c8a801bc699d95272597eb1791a6.png'),
    (5, 'assets/figma-export/753e4f578f1b2c3b27274a49b4b69055d8202c3e.png'),
    (6, 'assets/figma-export/9b4ba943613f3211d1b531b8660b5734f9f33a6c.png'),
    (7, 'assets/figma-export/a15c7742399f0f95918a67598c638bc804f55267.png'),
    (8, 'assets/figma-export/a56b6c49f52d789f50348bf05201345939481f39.png'),
    (9, 'assets/figma-export/c7a2095a5d0eb16cbdcad4fcb7c6f07e034adb0f.png'),
    (10, 'assets/figma-export/c8838a4de201fc5bc577cd015e3811581e088063.png'),
    (11, 'assets/figma-export/c92ff17556827d47a8e24c0f458a0824ae243188.png'),
    (12, 'assets/figma-export/cb5765b89518e8884da340f6be32f185c9b8eb3c.png'),
    (13, 'assets/figma-export/de171965d3bfa5271dc335a41f010e990998607a.png'),
    (14, 'assets/figma-export/e1ec3146e20511ae119a059f26c37f6000fa9966.png'),
    (15, 'assets/figma-export/e24b16ff6b341c1759a6066cedd4c69ab55c09ee.png'),
    (16, 'assets/figma-export/e5e7cb069a9fae2836e86ea32815e1c94a2c6848.png'),
    (17, 'assets/figma-export/e6b635973ccea83908aac292fa2c8d2ea9b85470.png'),
    (18, 'assets/figma-export/e9344f4646910949711e30d2ac55ebcace3e4a5b.png')
  ) AS t(id, url)
)
UPDATE public.products p
SET image_url = i.url
FROM numbered_products np
JOIN images i ON ((np.rn - 1) % 18 + 1) = i.id
WHERE p.id = np.id;
