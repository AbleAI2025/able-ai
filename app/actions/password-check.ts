'use server'

import top10k10plus from '@/app/components/signin/top_10k_10plus';

// follow the NIST 800-63 requirements (https://pages.nist.gov/800-63-3/sp800-63b.html#sec5)
export async function isPasswordCommon(password: string) {
  return top10k10plus.has(password.toLowerCase());
}
