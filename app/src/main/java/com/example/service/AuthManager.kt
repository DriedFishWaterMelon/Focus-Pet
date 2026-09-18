package com.example.service

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.provider.Settings
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.example.data.model.Pet
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await

data class UserProfile(
    val uid: String = "local_user_guest",
    val displayName: String = "Focus Guardian",
    val email: String? = null,
    val photoUrl: String? = null,
    val isAnonymous: Boolean = true,
    val isSignedIn: Boolean = false,
    val isFirebaseAvailable: Boolean = false,
    val authProvider: String = "Local"
)

object AuthManager {
    private const val TAG = "AuthManager"
    private const val PREFS_NAME = "focus_pet_auth_prefs"
    private const val KEY_UID = "auth_uid"
    private const val KEY_NAME = "auth_display_name"
    private const val KEY_EMAIL = "auth_email"
    private const val KEY_PHOTO = "auth_photo"
    private const val KEY_SIGNED_IN = "auth_signed_in"
    private const val KEY_PROVIDER = "auth_provider"

    // Project Firebase Configuration & Google OAuth Client ID
    const val GOOGLE_SERVER_CLIENT_ID = "1043505926268-sc8n86nv37qrlinqrlu4ljo9dmv04coh.apps.googleusercontent.com"
    private const val FIREBASE_PROJECT_ID = "gen-lang-client-0770902376"
    private const val FIREBASE_APP_ID = "1:1043505926268:web:29dcabe67029697a4e39f9"
    private const val FIREBASE_API_KEY = "AIzaSyBWzo0XwVzDZVHrG9Z4SS9n_pJKeMSBwNw"
    private const val FIREBASE_STORAGE_BUCKET = "gen-lang-client-0770902376.firebasestorage.app"
    private const val FIREBASE_SENDER_ID = "1043505926268"

    private val _userProfile = MutableStateFlow(UserProfile())
    val userProfile: StateFlow<UserProfile> = _userProfile.asStateFlow()

    private var firebaseAuth: FirebaseAuth? = null
    private var firestore: FirebaseFirestore? = null
    private var preferences: SharedPreferences? = null

    fun initialize(context: Context) {
        preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        try {
            if (FirebaseApp.getApps(context).isEmpty()) {
                val options = FirebaseOptions.Builder()
                    .setApplicationId(FIREBASE_APP_ID)
                    .setApiKey(FIREBASE_API_KEY)
                    .setProjectId(FIREBASE_PROJECT_ID)
                    .setStorageBucket(FIREBASE_STORAGE_BUCKET)
                    .setGcmSenderId(FIREBASE_SENDER_ID)
                    .build()
                FirebaseApp.initializeApp(context, options)
                Log.i(TAG, "Initialized FirebaseApp with client credentials")
            }

            val auth = FirebaseAuth.getInstance()
            firebaseAuth = auth
            firestore = FirebaseFirestore.getInstance()

            val currentUser = auth.currentUser
            if (currentUser != null) {
                val isGoogle = currentUser.providerData.any { it.providerId == GoogleAuthProvider.PROVIDER_ID }
                val profile = UserProfile(
                    uid = currentUser.uid,
                    displayName = currentUser.displayName ?: currentUser.email?.substringBefore("@") ?: "Guardian",
                    email = currentUser.email,
                    photoUrl = currentUser.photoUrl?.toString(),
                    isAnonymous = currentUser.isAnonymous,
                    isSignedIn = true,
                    isFirebaseAvailable = true,
                    authProvider = if (isGoogle) "Google" else if (currentUser.isAnonymous) "Guest" else "Email"
                )
                saveProfileToPrefs(profile)
                _userProfile.value = profile
            } else {
                // Check if local session was saved
                val wasSignedIn = preferences?.getBoolean(KEY_SIGNED_IN, false) ?: false
                if (wasSignedIn) {
                    val profile = UserProfile(
                        uid = preferences?.getString(KEY_UID, "local_user") ?: "local_user",
                        displayName = preferences?.getString(KEY_NAME, "Focus Guardian") ?: "Focus Guardian",
                        email = preferences?.getString(KEY_EMAIL, null),
                        photoUrl = preferences?.getString(KEY_PHOTO, null),
                        isAnonymous = false,
                        isSignedIn = true,
                        isFirebaseAvailable = true,
                        authProvider = preferences?.getString(KEY_PROVIDER, "Email") ?: "Email"
                    )
                    _userProfile.value = profile
                } else {
                    _userProfile.value = UserProfile(
                        uid = "guest_${System.currentTimeMillis() % 10000}",
                        displayName = "Guest Guardian",
                        isAnonymous = true,
                        isSignedIn = false,
                        isFirebaseAvailable = true,
                        authProvider = "Local"
                    )
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed initializing Firebase: ${e.message}", e)
            _userProfile.value = UserProfile(
                uid = "offline_user",
                displayName = "Offline Guardian",
                isAnonymous = true,
                isSignedIn = false,
                isFirebaseAvailable = false,
                authProvider = "Local"
            )
        }
    }

    private fun saveProfileToPrefs(profile: UserProfile) {
        preferences?.edit()?.apply {
            putBoolean(KEY_SIGNED_IN, profile.isSignedIn)
            putString(KEY_UID, profile.uid)
            putString(KEY_NAME, profile.displayName)
            putString(KEY_EMAIL, profile.email)
            putString(KEY_PHOTO, profile.photoUrl)
            putString(KEY_PROVIDER, profile.authProvider)
            apply()
        }
    }

    private fun isProviderDisabled(e: Throwable): Boolean {
        val msg = e.message.orEmpty()
        val isAuthException = (e as? FirebaseAuthException)?.errorCode?.contains("OPERATION_NOT_ALLOWED", ignoreCase = true) == true
        return isAuthException ||
                msg.contains("not allowed", ignoreCase = true) ||
                msg.contains("disabled", ignoreCase = true) ||
                msg.contains("CONFIGURATION_NOT_FOUND", ignoreCase = true)
    }

    suspend fun signInWithGoogle(activity: Activity): Result<UserProfile> {
        val auth = firebaseAuth ?: return Result.failure(Exception("Firebase Auth is not available"))

        return try {
            val credentialManager = CredentialManager.create(activity)
            
            // Build GetSignInWithGoogleOption for explicit button clicks
            val signInOption = GetSignInWithGoogleOption.Builder(serverClientId = GOOGLE_SERVER_CLIENT_ID)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(signInOption)
                .build()

            val response = credentialManager.getCredential(request = request, context = activity)
            val credential = response.credential

            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val idToken = googleIdTokenCredential.idToken
                val firebaseCredential = GoogleAuthProvider.getCredential(idToken, null)
                val authResult = auth.signInWithCredential(firebaseCredential).await()
                val user = authResult.user
                val profile = UserProfile(
                    uid = user?.uid ?: "google_${System.currentTimeMillis()}",
                    displayName = user?.displayName ?: googleIdTokenCredential.displayName ?: "Google User",
                    email = user?.email ?: googleIdTokenCredential.id,
                    photoUrl = user?.photoUrl?.toString() ?: googleIdTokenCredential.profilePictureUri?.toString(),
                    isAnonymous = false,
                    isSignedIn = true,
                    isFirebaseAvailable = true,
                    authProvider = "Google"
                )
                saveProfileToPrefs(profile)
                _userProfile.value = profile
                Result.success(profile)
            } else {
                Result.failure(Exception("Unsupported credential received"))
            }
        } catch (e: GetCredentialCancellationException) {
            Log.i(TAG, "User cancelled Google Sign-In sheet")
            Result.failure(Exception("Google Sign-In cancelled"))
        } catch (e: NoCredentialException) {
            Log.w(TAG, "No Google accounts found on device: ${e.message}")
            try {
                val intent = Intent(Settings.ACTION_ADD_ACCOUNT).apply {
                    putExtra(Settings.EXTRA_ACCOUNT_TYPES, arrayOf("com.google"))
                }
                activity.startActivity(intent)
            } catch (intentErr: Exception) {
                Log.w(TAG, "Could not open add account settings: ${intentErr.message}")
            }
            Result.failure(Exception("No Google account found on this device. Please add a Google account in Android Settings, or use Email / Guest sign-in."))
        } catch (e: GetCredentialException) {
            Log.w(TAG, "Credential Manager error: ${e.message}")
            Result.failure(Exception(e.message ?: "Google Sign-In is unavailable on this device"))
        } catch (e: Exception) {
            Log.e(TAG, "Google Sign-In failed", e)
            Result.failure(e)
        }
    }

    suspend fun signInAnonymously(): Result<UserProfile> {
        val auth = firebaseAuth ?: return signInAsGuestLocally()
        return try {
            val result = auth.signInAnonymously().await()
            val user = result.user
            val profile = UserProfile(
                uid = user?.uid ?: "anon_${System.currentTimeMillis()}",
                displayName = "Guardian Explorer",
                email = null,
                photoUrl = null,
                isAnonymous = true,
                isSignedIn = true,
                isFirebaseAvailable = true,
                authProvider = "Guest"
            )
            saveProfileToPrefs(profile)
            _userProfile.value = profile
            Result.success(profile)
        } catch (e: Exception) {
            if (isProviderDisabled(e)) {
                Log.w(TAG, "Anonymous auth disabled in Firebase Console: ${e.message}")
                signInAsGuestLocally()
            } else {
                Result.failure(e)
            }
        }
    }

    private fun signInAsGuestLocally(): Result<UserProfile> {
        val profile = UserProfile(
            uid = "guest_${System.currentTimeMillis() % 10000}",
            displayName = "Guest Explorer",
            email = null,
            photoUrl = null,
            isAnonymous = true,
            isSignedIn = true,
            isFirebaseAvailable = false,
            authProvider = "Guest"
        )
        saveProfileToPrefs(profile)
        _userProfile.value = profile
        return Result.success(profile)
    }

    suspend fun signInWithEmail(email: String, pass: String): Result<UserProfile> {
        val trimmedEmail = email.trim()
        val displayName = trimmedEmail.substringBefore("@").replaceFirstChar {
            if (it.isLowerCase()) it.titlecase() else it.toString()
        }

        val auth = firebaseAuth
        if (auth == null) {
            return signInWithEmailFallback(trimmedEmail, displayName)
        }

        return try {
            val user = try {
                val result = auth.signInWithEmailAndPassword(trimmedEmail, pass).await()
                result.user
            } catch (e: Exception) {
                if (isProviderDisabled(e)) {
                    Log.w(TAG, "Email sign-in provider is disabled in Firebase: ${e.message}")
                    return signInWithEmailFallback(trimmedEmail, displayName)
                }

                // If not found, try create account
                try {
                    val createResult = auth.createUserWithEmailAndPassword(trimmedEmail, pass).await()
                    createResult.user
                } catch (createEx: Exception) {
                    if (isProviderDisabled(createEx)) {
                        Log.w(TAG, "Email sign-up provider is disabled in Firebase: ${createEx.message}")
                        return signInWithEmailFallback(trimmedEmail, displayName)
                    }
                    throw createEx
                }
            }

            val profile = UserProfile(
                uid = user?.uid ?: "user_${trimmedEmail.hashCode()}",
                displayName = user?.displayName ?: displayName,
                email = user?.email ?: trimmedEmail,
                photoUrl = user?.photoUrl?.toString(),
                isAnonymous = false,
                isSignedIn = true,
                isFirebaseAvailable = true,
                authProvider = "Email"
            )
            saveProfileToPrefs(profile)
            _userProfile.value = profile
            Result.success(profile)
        } catch (e: Exception) {
            if (isProviderDisabled(e)) {
                signInWithEmailFallback(trimmedEmail, displayName)
            } else {
                Result.failure(e)
            }
        }
    }

    private suspend fun signInWithEmailFallback(email: String, displayName: String): Result<UserProfile> {
        var firebaseUid: String? = null
        var isFirebaseAvail = false
        val auth = firebaseAuth
        if (auth != null) {
            try {
                val anonResult = auth.signInAnonymously().await()
                firebaseUid = anonResult.user?.uid
                isFirebaseAvail = true
            } catch (anonEx: Exception) {
                Log.w(TAG, "Anonymous auth unavailable as email fallback: ${anonEx.message}")
            }
        }

        val uid = firebaseUid ?: "local_user_${email.hashCode().toString().replace("-", "").takeLast(8)}"
        val profile = UserProfile(
            uid = uid,
            displayName = displayName,
            email = email,
            photoUrl = null,
            isAnonymous = false,
            isSignedIn = true,
            isFirebaseAvailable = isFirebaseAvail,
            authProvider = "Email"
        )
        saveProfileToPrefs(profile)
        _userProfile.value = profile
        return Result.success(profile)
    }

    fun signOut() {
        try {
            firebaseAuth?.signOut()
        } catch (e: Exception) {
            Log.e(TAG, "Sign out error", e)
        }
        preferences?.edit()?.clear()?.apply()
        _userProfile.value = UserProfile(
            uid = "guest_${System.currentTimeMillis() % 10000}",
            displayName = "Guest Guardian",
            isAnonymous = true,
            isSignedIn = false,
            isFirebaseAvailable = firebaseAuth != null,
            authProvider = "Local"
        )
    }

    suspend fun syncPetToFirestore(pet: Pet) {
        val db = firestore ?: return
        val user = firebaseAuth?.currentUser ?: return

        try {
            val petData = hashMapOf(
                "name" to pet.name,
                "species" to pet.species,
                "hunger" to pet.hunger,
                "happiness" to pet.happiness,
                "energy" to pet.energy,
                "exp" to pet.exp,
                "level" to pet.level,
                "stage" to pet.stage.name,
                "totalFocusMinutes" to pet.totalFocusMinutes,
                "streakDays" to pet.streakDays,
                "coins" to pet.coins,
                "lastSync" to System.currentTimeMillis()
            )
            db.collection("users")
                .document(user.uid)
                .collection("pet")
                .document("current")
                .set(petData, SetOptions.merge())
                .await()
            Log.d(TAG, "Successfully synced pet data to Firestore")
        } catch (e: Exception) {
            Log.w(TAG, "Firestore sync failed: ${e.message}")
        }
    }
}
