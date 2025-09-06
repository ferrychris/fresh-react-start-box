-- Ensure anon/authenticated can call the RPC
GRANT EXECUTE ON FUNCTION public.get_fan_stats(uuid) TO anon, authenticated;

-- Provide a text-arg overload that casts to uuid to avoid 400s from type mismatch
CREATE OR REPLACE FUNCTION public.get_fan_stats(p_fan_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uuid uuid;
BEGIN
  BEGIN
    v_uuid := p_fan_id::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Invalid UUID string; return defaults
    RETURN jsonb_build_object(
      'fan_id', p_fan_id,
      'total_tips', 0,
      'active_subscriptions', 0,
      'support_points', 0,
      'activity_streak', 0,
      'created_at', now(),
      'updated_at', now()
    );
  END;
  RETURN public.get_fan_stats(v_uuid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_fan_stats(text) TO anon, authenticated;
