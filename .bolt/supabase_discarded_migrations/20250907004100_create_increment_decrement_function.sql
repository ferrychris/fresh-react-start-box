-- Create a helper function for incrementing/decrementing values
CREATE OR REPLACE FUNCTION public.increment_decrement(val integer, increment boolean)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF increment THEN
    RETURN val;
  ELSE
    RETURN -val;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_decrement(integer, boolean) TO authenticated;
