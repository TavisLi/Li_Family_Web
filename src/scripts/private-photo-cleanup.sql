DELETE FROM public.media WHERE id = $1 AND family_asset_key = $2 RETURNING id
