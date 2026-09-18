package com.example.ui.viewmodel

import android.app.Activity
import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.AppDatabase
import com.example.data.model.InventoryItem
import com.example.data.model.Pet
import com.example.data.model.ScreenFreeSession
import com.example.data.repository.PetRepository
import com.example.service.AppUsageInfo
import com.example.service.AuthManager
import com.example.service.NotificationHelper
import com.example.service.ScreenTimeTracker
import com.example.service.UserProfile
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class PetViewModel(application: Application) : AndroidViewModel(application) {

    private val database = AppDatabase.getDatabase(application, viewModelScope)
    private val repository = PetRepository(database)

    // Reactive Pet State
    val pet: StateFlow<Pet> = repository.pet
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = Pet()
        )

    // Reactive Sessions
    val sessions: StateFlow<List<ScreenFreeSession>> = repository.sessions
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // Reactive Inventory
    val inventory: StateFlow<List<InventoryItem>> = repository.inventory
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // Auth Profile
    val userProfile: StateFlow<UserProfile> = AuthManager.userProfile

    private val _isSigningIn = MutableStateFlow(false)
    val isSigningIn: StateFlow<Boolean> = _isSigningIn.asStateFlow()

    private val _authMessage = MutableStateFlow<String?>(null)
    val authMessage: StateFlow<String?> = _authMessage.asStateFlow()

    fun clearAuthMessage() {
        _authMessage.value = null
    }

    // Screen-Free Active Session State
    private val _isFocusActive = MutableStateFlow(false)
    val isFocusActive: StateFlow<Boolean> = _isFocusActive.asStateFlow()

    private val _targetDurationMinutes = MutableStateFlow(25)
    val targetDurationMinutes: StateFlow<Int> = _targetDurationMinutes.asStateFlow()

    private val _remainingSeconds = MutableStateFlow(25 * 60)
    val remainingSeconds: StateFlow<Int> = _remainingSeconds.asStateFlow()

    private val _selectedTag = MutableStateFlow("Deep Work")
    val selectedTag: StateFlow<String> = _selectedTag.asStateFlow()

    // Reward Celebration Modal
    private val _celebrationSession = MutableStateFlow<ScreenFreeSession?>(null)
    val celebrationSession: StateFlow<ScreenFreeSession?> = _celebrationSession.asStateFlow()

    // Interactive Pet eating animation flag
    private val _isEatingAnimation = MutableStateFlow(false)
    val isEatingAnimation: StateFlow<Boolean> = _isEatingAnimation.asStateFlow()

    // Screen Time Stats
    private val _hasUsagePermission = MutableStateFlow(false)
    val hasUsagePermission: StateFlow<Boolean> = _hasUsagePermission.asStateFlow()

    private val _todayScreenTimeMinutes = MutableStateFlow(145)
    val todayScreenTimeMinutes: StateFlow<Int> = _todayScreenTimeMinutes.asStateFlow()

    private val _topUsedApps = MutableStateFlow<List<AppUsageInfo>>(emptyList())
    val topUsedApps: StateFlow<List<AppUsageInfo>> = _topUsedApps.asStateFlow()

    private var timerJob: Job? = null

    init {
        AuthManager.initialize(application)
        NotificationHelper.createNotificationChannel(application)
        refreshUsageStats()
    }

    fun refreshUsageStats() {
        val context = getApplication<Application>()
        val hasPerm = ScreenTimeTracker.hasUsageAccessPermission(context)
        _hasUsagePermission.value = hasPerm
        _todayScreenTimeMinutes.value = ScreenTimeTracker.getTodayScreenTimeMinutes(context)
        _topUsedApps.value = ScreenTimeTracker.getTopUsedApps(context)
    }

    fun setTargetDuration(minutes: Int) {
        if (!_isFocusActive.value) {
            _targetDurationMinutes.value = minutes
            _remainingSeconds.value = minutes * 60
        }
    }

    fun setSelectedTag(tag: String) {
        _selectedTag.value = tag
    }

    fun startFocusSession() {
        if (_isFocusActive.value) return
        _isFocusActive.value = true
        _remainingSeconds.value = _targetDurationMinutes.value * 60

        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (_remainingSeconds.value > 0 && _isFocusActive.value) {
                delay(1000L)
                _remainingSeconds.value -= 1
            }

            if (_isFocusActive.value && _remainingSeconds.value <= 0) {
                finishFocusSession(completed = true)
            }
        }
    }

    fun cancelFocusSession() {
        timerJob?.cancel()
        val elapsedMinutes = (_targetDurationMinutes.value * 60 - _remainingSeconds.value) / 60
        _isFocusActive.value = false
        _remainingSeconds.value = _targetDurationMinutes.value * 60

        // If at least 2 minutes were completed, award partial EXP
        if (elapsedMinutes >= 2) {
            viewModelScope.launch {
                val currentPet = pet.value
                val (session, _) = repository.completeFocusSession(
                    currentPet = currentPet,
                    targetMinutes = _targetDurationMinutes.value,
                    actualMinutes = elapsedMinutes,
                    tag = _selectedTag.value
                )
                _celebrationSession.value = session
                AuthManager.syncPetToFirestore(pet.value)
            }
        }
    }

    fun finishFocusSession(completed: Boolean) {
        timerJob?.cancel()
        _isFocusActive.value = false
        val target = _targetDurationMinutes.value
        val actual = if (completed) target else (target * 60 - _remainingSeconds.value) / 60
        _remainingSeconds.value = target * 60

        viewModelScope.launch {
            val currentPet = pet.value
            val (session, updatedPet) = repository.completeFocusSession(
                currentPet = currentPet,
                targetMinutes = target,
                actualMinutes = actual,
                tag = _selectedTag.value
            )
            _celebrationSession.value = session

            // Send notification
            val context = getApplication<Application>()
            NotificationHelper.showGoalCompleteNotification(
                context = context,
                petName = updatedPet.name,
                minutes = actual,
                expEarned = session.expEarned,
                rewardItem = session.itemRewardName
            )

            // Sync with Firestore
            AuthManager.syncPetToFirestore(updatedPet)
        }
    }

    fun dismissCelebrationModal() {
        _celebrationSession.value = null
    }

    fun feedPet(item: InventoryItem) {
        viewModelScope.launch {
            val currentPet = pet.value
            val success = repository.feedPet(currentPet, item)
            if (success) {
                _isEatingAnimation.value = true
                delay(1200L)
                _isEatingAnimation.value = false
                AuthManager.syncPetToFirestore(pet.value)
            }
        }
    }

    fun patPet() {
        viewModelScope.launch {
            val currentPet = pet.value
            val updated = repository.playWithPet(currentPet)
            AuthManager.syncPetToFirestore(updated)
        }
    }

    fun renamePet(newName: String) {
        viewModelScope.launch {
            repository.renamePet(pet.value, newName.trim())
            AuthManager.syncPetToFirestore(pet.value)
        }
    }

    fun changeSpecies(species: String) {
        viewModelScope.launch {
            repository.changePetSpecies(pet.value, species)
            AuthManager.syncPetToFirestore(pet.value)
        }
    }

    fun signInWithGoogle(activity: Activity) {
        viewModelScope.launch {
            _isSigningIn.value = true
            _authMessage.value = null
            val result = AuthManager.signInWithGoogle(activity)
            _isSigningIn.value = false
            result.onSuccess { profile ->
                _authMessage.value = "Welcome, ${profile.displayName}!"
                AuthManager.syncPetToFirestore(pet.value)
            }.onFailure { error ->
                val msg = error.message ?: "Sign-in failed"
                if (!msg.contains("cancelled", ignoreCase = true)) {
                    _authMessage.value = msg
                }
            }
        }
    }

    fun signInAnonymously() {
        viewModelScope.launch {
            _isSigningIn.value = true
            _authMessage.value = null
            val result = AuthManager.signInAnonymously()
            _isSigningIn.value = false
            result.onSuccess {
                _authMessage.value = "Logged in as Guest Explorer"
                AuthManager.syncPetToFirestore(pet.value)
            }.onFailure {
                _authMessage.value = "Guest sign-in failed: ${it.message}"
            }
        }
    }

    fun signInWithEmail(email: String, pass: String) {
        viewModelScope.launch {
            _isSigningIn.value = true
            _authMessage.value = null
            val result = AuthManager.signInWithEmail(email, pass)
            _isSigningIn.value = false
            result.onSuccess {
                _authMessage.value = "Signed in as ${it.displayName}"
                AuthManager.syncPetToFirestore(pet.value)
            }.onFailure {
                _authMessage.value = "Email auth failed: ${it.message}"
            }
        }
    }

    fun signOut() {
        AuthManager.signOut()
        _authMessage.value = "Signed out successfully"
    }

    fun testHungryNotification() {
        val context = getApplication<Application>()
        NotificationHelper.showPetHungryNotification(context, pet.value.name)
    }

    fun testGoalCompleteNotification() {
        val context = getApplication<Application>()
        NotificationHelper.showGoalCompleteNotification(
            context,
            pet.value.name,
            30,
            60,
            "Golden Honey Apple"
        )
    }

    fun testReminderNotification() {
        val context = getApplication<Application>()
        NotificationHelper.showFocusReminderNotification(context)
    }

    fun resetData() {
        viewModelScope.launch {
            repository.resetAllData()
        }
    }
}
