/**
 * WARNING: This file is designed to run in a Node.js server environment or CLI scripts.
 * DO NOT import this file in any frontend React component (client-side code)
 * as it relies on 'firebase-admin' which is a server-only SDK and will break Vite.
 */

import { adminAuth } from "../config/firebaseAdmin.js";

/**
 * Assigns a custom role/claims to a user in Firebase Auth.
 * 
 * @param {string} uid - The Firebase Auth User UID
 * @param {'customer' | 'admin'} role - The role to assign to the user
 * @returns {Promise<boolean>}
 */
export const setUserRole = async (uid, role) => {
  if (!uid || !role) {
    throw new Error("UID and role parameters are required.");
  }

  try {
    await adminAuth.setCustomUserClaims(uid, { role });
    console.log(`✅ Role "${role}" successfully assigned to user: ${uid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error assigning role "${role}" to user ${uid}:`, error.message || error);
    throw error;
  }
};
