package com.example

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.HourglassBottom
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.service.ScreenTimeTracker
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.InventoryScreen
import com.example.ui.screens.RewardDialog
import com.example.ui.screens.ScreenFreeScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.screens.StatisticsScreen
import com.example.ui.theme.Emerald400
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.Zinc400
import com.example.ui.theme.Zinc50
import com.example.ui.theme.Zinc800
import com.example.ui.theme.Zinc900
import com.example.ui.theme.Zinc950
import com.example.ui.viewmodel.PetViewModel

enum class AppNavTab(val title: String, val icon: ImageVector, val tag: String) {
    HOME("Pet", Icons.Default.Home, "nav_home"),
    SCREEN_FREE("Focus", Icons.Default.HourglassBottom, "nav_screen_free"),
    STATISTICS("Stats", Icons.Default.BarChart, "nav_statistics"),
    INVENTORY("Items", Icons.Default.Inventory2, "nav_inventory"),
    SETTINGS("Settings", Icons.Default.Settings, "nav_settings")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                FocusPetApp()
            }
        }
    }
}

@Composable
fun FocusPetApp(viewModel: PetViewModel = viewModel()) {
    val context = LocalContext.current

    // Request Notification Permission on Android 13+
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { _ -> }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    // Collect States
    val pet by viewModel.pet.collectAsStateWithLifecycle()
    val sessions by viewModel.sessions.collectAsStateWithLifecycle()
    val inventory by viewModel.inventory.collectAsStateWithLifecycle()
    val userProfile by viewModel.userProfile.collectAsStateWithLifecycle()

    val isFocusActive by viewModel.isFocusActive.collectAsStateWithLifecycle()
    val targetDurationMinutes by viewModel.targetDurationMinutes.collectAsStateWithLifecycle()
    val remainingSeconds by viewModel.remainingSeconds.collectAsStateWithLifecycle()
    val selectedTag by viewModel.selectedTag.collectAsStateWithLifecycle()

    val celebrationSession by viewModel.celebrationSession.collectAsStateWithLifecycle()
    val isEating by viewModel.isEatingAnimation.collectAsStateWithLifecycle()

    val hasUsagePermission by viewModel.hasUsagePermission.collectAsStateWithLifecycle()
    val todayScreenTimeMinutes by viewModel.todayScreenTimeMinutes.collectAsStateWithLifecycle()
    val topApps by viewModel.topUsedApps.collectAsStateWithLifecycle()

    val isSigningIn by viewModel.isSigningIn.collectAsStateWithLifecycle()
    val authMessage by viewModel.authMessage.collectAsStateWithLifecycle()

    var currentTab by remember { mutableStateOf(AppNavTab.HOME) }

    // If a focus session is active and user switches away or starts focus, we can navigate smoothly
    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = Zinc950,
        contentWindowInsets = WindowInsets.safeDrawing,
        bottomBar = {
            ShadcnBottomNavBar(
                currentTab = currentTab,
                onTabSelected = { currentTab = it }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            Crossfade(
                targetState = currentTab,
                label = "screen_crossfade"
            ) { tab ->
                when (tab) {
                    AppNavTab.HOME -> HomeScreen(
                        pet = pet,
                        inventory = inventory,
                        isEating = isEating,
                        onPetTap = { viewModel.patPet() },
                        onFeedItem = { viewModel.feedPet(it) },
                        onNavigateToScreenFree = { currentTab = AppNavTab.SCREEN_FREE }
                    )

                    AppNavTab.SCREEN_FREE -> ScreenFreeScreen(
                        pet = pet,
                        isFocusActive = isFocusActive,
                        targetDurationMinutes = targetDurationMinutes,
                        remainingSeconds = remainingSeconds,
                        selectedTag = selectedTag,
                        onSelectDuration = { viewModel.setTargetDuration(it) },
                        onSelectTag = { viewModel.setSelectedTag(it) },
                        onStartFocus = { viewModel.startFocusSession() },
                        onCancelFocus = { viewModel.cancelFocusSession() },
                        onFinishEarly = { viewModel.finishFocusSession(completed = false) }
                    )

                    AppNavTab.STATISTICS -> StatisticsScreen(
                        pet = pet,
                        sessions = sessions,
                        hasUsagePermission = hasUsagePermission,
                        todayScreenTimeMinutes = todayScreenTimeMinutes,
                        topApps = topApps,
                        onRequestUsagePermission = {
                            ScreenTimeTracker.openUsageAccessSettings(context)
                        },
                        onRefreshStats = { viewModel.refreshUsageStats() }
                    )

                    AppNavTab.INVENTORY -> InventoryScreen(
                        pet = pet,
                        inventory = inventory,
                        onFeedItem = { viewModel.feedPet(it) },
                        onRenamePet = { viewModel.renamePet(it) },
                        onChangeSpecies = { viewModel.changeSpecies(it) }
                    )

                    AppNavTab.SETTINGS -> SettingsScreen(
                        userProfile = userProfile,
                        isSigningIn = isSigningIn,
                        authMessage = authMessage,
                        onClearAuthMessage = { viewModel.clearAuthMessage() },
                        hasUsagePermission = hasUsagePermission,
                        onRequestUsagePermission = {
                            ScreenTimeTracker.openUsageAccessSettings(context)
                        },
                        onSignInWithGoogle = {
                            (context as? ComponentActivity)?.let { activity ->
                                viewModel.signInWithGoogle(activity)
                            }
                        },
                        onSignInWithEmail = { email, pass ->
                            viewModel.signInWithEmail(email, pass)
                        },
                        onSignInAnonymously = {
                            viewModel.signInAnonymously()
                        },
                        onSignOut = { viewModel.signOut() },
                        onTestHungryNotification = { viewModel.testHungryNotification() },
                        onTestGoalNotification = { viewModel.testGoalCompleteNotification() },
                        onTestReminderNotification = { viewModel.testReminderNotification() },
                        onResetData = { viewModel.resetData() }
                    )
                }
            }

            // Celebration Modal when screen-free time is completed
            celebrationSession?.let { session ->
                RewardDialog(
                    session = session,
                    pet = pet,
                    onDismiss = {
                        viewModel.dismissCelebrationModal()
                        currentTab = AppNavTab.HOME
                    }
                )
            }
        }
    }
}

// Custom shadcn Bottom Navigation Bar
@Composable
fun ShadcnBottomNavBar(
    currentTab: AppNavTab,
    onTabSelected: (AppNavTab) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .border(
                width = 1.dp,
                color = Zinc800
            ),
        color = Zinc950
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp, horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            AppNavTab.entries.forEach { tab ->
                val isSelected = currentTab == tab
                val iconColor = if (isSelected) Zinc50 else Zinc400
                val textColor = if (isSelected) Zinc50 else Zinc400

                Column(
                    modifier = Modifier
                        .testTag(tab.tag)
                        .clip(CircleShape)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) { onTabSelected(tab) }
                        .padding(horizontal = 12.dp, vertical = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(if (isSelected) Zinc800 else Color.Transparent),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = tab.icon,
                            contentDescription = tab.title,
                            tint = iconColor,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = tab.title,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                        color = textColor
                    )
                }
            }
        }
    }
}
