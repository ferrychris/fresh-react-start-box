import { supabase } from '../supabase';

export const sendVirtualGift = async (fanId: string, racerId: string, giftId: string, message?: string) => {
  try {
    const { data, error } = await supabase.rpc('send_virtual_gift', {
      p_fan_id: fanId,
      p_racer_id: racerId,
      p_gift_id: giftId,
      p_message: message
    });

    if (error) {
      console.error('Error sending virtual gift:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('An unexpected error occurred in sendVirtualGift:', error);
    throw error;
  }
};
