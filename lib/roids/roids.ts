import { supabase } from '@/lib/supabase/supabase';

export async function getUserRoidsBalance(userId: string) {
  const { data, error } = await supabase
    .rpc('get_user_roids_balance', { p_user_id: userId });

  if (error) throw error;
  return data;
}

export async function checkRoidsBalance(userId: string, amount: number) {
  const { data, error } = await supabase
    .rpc('check_roids_balance', { 
      p_user_id: userId, 
      p_amount: amount 
    });

  if (error) throw error;
  return data;
}

export async function useRoidsForAsset(userId: string, amount: number, productId: string) {
  const { data, error } = await supabase
    .rpc('use_roids_for_asset', {
      p_user_id: userId,
      p_amount: amount,
      p_product_id: productId
    });

  if (error) throw error;
  return data;
}

export async function getRoidsTransactions(userId: string, limit = 10, offset = 0) {
  const { data, error } = await supabase
    .rpc('get_user_roids_transactions', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset
    });

  if (error) throw error;
  return data;
} 