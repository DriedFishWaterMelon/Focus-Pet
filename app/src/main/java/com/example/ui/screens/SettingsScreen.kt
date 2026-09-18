package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Smartphone
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.service.UserProfile
import com.example.ui.components.BadgeVariant
import com.example.ui.components.ButtonVariant
import com.example.ui.components.ShadcnBadge
import com.example.ui.components.ShadcnButton
import com.example.ui.components.ShadcnCard
import com.example.ui.theme.Amber400
import com.example.ui.theme.Emerald400
import com.example.ui.theme.Red500
import com.example.ui.theme.Rose400
import com.example.ui.theme.Violet400
import com.example.ui.theme.Zinc100
import com.example.ui.theme.Zinc400
import com.example.ui.theme.Zinc50
import com.example.ui.theme.Zinc700
import com.example.ui.theme.Zinc800
import com.example.ui.theme.Zinc900
import com.example.ui.theme.Zinc950

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    userProfile: UserProfile,
    isSigningIn: Boolean,
    authMessage: String?,
    onClearAuthMessage: () -> Unit,
    hasUsagePermission: Boolean,
    onRequestUsagePermission: () -> Unit,
    onSignInWithGoogle: () -> Unit,
    onSignInWithEmail: (String, String) -> Unit,
    onSignInAnonymously: () -> Unit,
    onSignOut: () -> Unit,
    onTestHungryNotification: () -> Unit,
    onTestGoalNotification: () -> Unit,
    onTestReminderNotification: () -> Unit,
    onResetData: () -> Unit,
    modifier: Modifier = Modifier
) {
    var notificationsEnabled by remember { mutableStateOf(true) }
    var vibrationEnabled by remember { mutableStateOf(true) }
    var showAuthDialog by remember { mutableStateOf(false) }
    var showResetDialog by remember { mutableStateOf(false) }

    var emailInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Column {
                Text(
                    text = "App Settings",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Zinc50,
                    letterSpacing = (-0.5).sp
                )
                Text(
                    text = "Authentication, system permissions & notification alerts",
                    fontSize = 13.sp,
                    color = Zinc400
                )
            }
        }

        // Firebase Auth & Cloud Sync Card
        item {
            ShadcnCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        if (userProfile.photoUrl != null) {
                            AsyncImage(
                                model = userProfile.photoUrl,
                                contentDescription = "Profile avatar",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .border(1.5.dp, Emerald400.copy(alpha = 0.6f), CircleShape)
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(Zinc800)
                                    .border(1.dp, Zinc700, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = Zinc50)
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = userProfile.displayName,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Zinc50
                            )
                            Text(
                                text = if (userProfile.isSignedIn) {
                                    userProfile.email ?: "Firebase Guest Account"
                                } else {
                                    "Local Storage Mode"
                                },
                                fontSize = 12.sp,
                                color = Zinc400
                            )
                        }
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        if (userProfile.isSignedIn) {
                            val badgeVariant = when {
                                userProfile.authProvider.startsWith("Google") -> BadgeVariant.SUCCESS
                                userProfile.authProvider.startsWith("Email") -> BadgeVariant.VIOLET
                                else -> BadgeVariant.SECONDARY
                            }
                            val badgeLabel = when {
                                userProfile.authProvider.contains("Synced") -> userProfile.authProvider
                                userProfile.authProvider.contains("Local") -> userProfile.authProvider
                                else -> "${userProfile.authProvider} Synced"
                            }
                            ShadcnBadge(
                                text = badgeLabel,
                                variant = badgeVariant
                            )
                        } else {
                            ShadcnBadge(text = "Local Storage", variant = BadgeVariant.SECONDARY)
                        }
                    }
                }

                // Auth status / error feedback banner
                if (authMessage != null) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Zinc800)
                            .border(1.dp, Zinc700, RoundedCornerShape(8.dp))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Info,
                                    contentDescription = null,
                                    tint = Emerald400,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = authMessage,
                                    fontSize = 12.sp,
                                    color = Zinc100
                                )
                            }
                            IconButton(
                                onClick = onClearAuthMessage,
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Dismiss",
                                    tint = Zinc400,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                if (userProfile.isSignedIn) {
                    ShadcnButton(
                        text = "Sign Out",
                        onClick = onSignOut,
                        variant = ButtonVariant.OUTLINE,
                        modifier = Modifier.fillMaxWidth(),
                        testTag = "settings_sign_out_button"
                    )
                } else {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Prominent Google OAuth Button
                        Button(
                            onClick = onSignInWithGoogle,
                            enabled = !isSigningIn,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.White,
                                contentColor = Color(0xFF1F1F1F)
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                                .testTag("settings_google_signin_button")
                        ) {
                            if (isSigningIn) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    color = Color(0xFF1F1F1F),
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "Connecting to Google...",
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 14.sp,
                                    color = Color(0xFF1F1F1F)
                                )
                            } else {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_google_logo),
                                    contentDescription = "Google Logo",
                                    modifier = Modifier.size(20.dp),
                                    tint = Color.Unspecified
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "Sign in with Google",
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 14.sp,
                                    color = Color(0xFF1F1F1F)
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            ShadcnButton(
                                text = "Email Sign In",
                                onClick = { showAuthDialog = true },
                                variant = ButtonVariant.SECONDARY,
                                modifier = Modifier.weight(1f),
                                testTag = "settings_email_signin_button"
                            )
                            ShadcnButton(
                                text = "Guest Auth",
                                onClick = onSignInAnonymously,
                                variant = ButtonVariant.GHOST,
                                modifier = Modifier.weight(1f),
                                testTag = "settings_guest_auth_button"
                            )
                        }
                    }
                }
            }
        }

        // OS Permissions Section
        item {
            ShadcnCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "System Permissions",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Zinc50
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Usage Access
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Screen Time Usage Stats",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = Zinc50
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            if (hasUsagePermission) {
                                ShadcnBadge(text = "Granted", variant = BadgeVariant.SUCCESS)
                            } else {
                                ShadcnBadge(text = "Required", variant = BadgeVariant.WARNING)
                            }
                        }
                        Text(
                            text = "UsageStatsManager access to read daily phone usage",
                            fontSize = 12.sp,
                            color = Zinc400
                        )
                    }

                    ShadcnButton(
                        text = if (hasUsagePermission) "Manage" else "Grant",
                        onClick = onRequestUsagePermission,
                        variant = if (hasUsagePermission) ButtonVariant.OUTLINE else ButtonVariant.EMERALD,
                        testTag = "settings_usage_access_button"
                    )
                }
            }
        }

        // Notification Alerts Section
        item {
            ShadcnCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Notification Triggers (UR-07)",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Zinc50
                )
                Text(
                    text = "Automated reminders when pet is hungry or goal is met",
                    fontSize = 12.sp,
                    color = Zinc400
                )

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Enable Notifications",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = Zinc50
                        )
                        Text(
                            text = "Receive system push notifications",
                            fontSize = 12.sp,
                            color = Zinc400
                        )
                    }
                    Switch(
                        checked = notificationsEnabled,
                        onCheckedChange = { notificationsEnabled = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Zinc950,
                            checkedTrackColor = Emerald400,
                            uncheckedThumbColor = Zinc400,
                            uncheckedTrackColor = Zinc800
                        )
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Send Test Push Alerts:",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = Zinc400
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ShadcnButton(
                        text = "🐾 Hungry Alert",
                        onClick = onTestHungryNotification,
                        variant = ButtonVariant.SECONDARY,
                        modifier = Modifier.weight(1f),
                        testTag = "test_hungry_notification_button"
                    )
                    ShadcnButton(
                        text = "🎉 Goal Complete",
                        onClick = onTestGoalNotification,
                        variant = ButtonVariant.SECONDARY,
                        modifier = Modifier.weight(1f),
                        testTag = "test_goal_notification_button"
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                ShadcnButton(
                    text = "🌱 Digital Detox Reminder",
                    onClick = onTestReminderNotification,
                    variant = ButtonVariant.OUTLINE,
                    modifier = Modifier.fillMaxWidth(),
                    testTag = "test_reminder_notification_button"
                )
            }
        }

        // Data & Privacy (NFR-04 / NFR-05)
        item {
            ShadcnCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Data & Privacy",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Zinc50
                )
                Text(
                    text = "All screen-time statistics are processed locally on device according to NFR-05 privacy compliance.",
                    fontSize = 12.sp,
                    color = Zinc400
                )

                Spacer(modifier = Modifier.height(14.dp))

                ShadcnButton(
                    text = "Reset Game & Clear History",
                    icon = Icons.Default.RestartAlt,
                    onClick = { showResetDialog = true },
                    variant = ButtonVariant.DESTRUCTIVE,
                    modifier = Modifier.fillMaxWidth(),
                    testTag = "reset_game_data_button"
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    // Auth Dialog
    if (showAuthDialog) {
        BasicAlertDialog(
            onDismissRequest = { showAuthDialog = false },
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .clip(RoundedCornerShape(16.dp))
                .background(Zinc900)
                .border(1.dp, Zinc800, RoundedCornerShape(16.dp))
                .padding(20.dp)
        ) {
            Column {
                Text(
                    text = "Firebase Sign In",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Zinc50
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Sign in or register to sync your pet and progress.",
                    fontSize = 12.sp,
                    color = Zinc400
                )
                Spacer(modifier = Modifier.height(14.dp))

                // Quick Google Sign-In in modal
                Button(
                    onClick = {
                        showAuthDialog = false
                        onSignInWithGoogle()
                    },
                    enabled = !isSigningIn,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = Color(0xFF1F1F1F)
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(42.dp)
                ) {
                    Icon(
                        painter = painterResource(id = R.drawable.ic_google_logo),
                        contentDescription = "Google Logo",
                        modifier = Modifier.size(18.dp),
                        tint = Color.Unspecified
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Continue with Google",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                        color = Color(0xFF1F1F1F)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.weight(1f).height(1.dp).background(Zinc800))
                    Text(
                        text = "  or email  ",
                        fontSize = 11.sp,
                        color = Zinc400
                    )
                    Box(modifier = Modifier.weight(1f).height(1.dp).background(Zinc800))
                }
                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = emailInput,
                    onValueChange = { emailInput = it },
                    label = { Text("Email", color = Zinc400) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Zinc50,
                        unfocusedTextColor = Zinc50,
                        focusedBorderColor = Emerald400,
                        unfocusedBorderColor = Zinc700,
                        focusedContainerColor = Zinc800,
                        unfocusedContainerColor = Zinc800
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = passwordInput,
                    onValueChange = { passwordInput = it },
                    label = { Text("Password", color = Zinc400) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Zinc50,
                        unfocusedTextColor = Zinc50,
                        focusedBorderColor = Emerald400,
                        unfocusedBorderColor = Zinc700,
                        focusedContainerColor = Zinc800,
                        unfocusedContainerColor = Zinc800
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ShadcnButton(
                        text = "Cancel",
                        onClick = { showAuthDialog = false },
                        variant = ButtonVariant.GHOST,
                        modifier = Modifier.weight(1f)
                    )
                    ShadcnButton(
                        text = "Sign In / Register",
                        onClick = {
                            if (emailInput.isNotBlank() && passwordInput.length >= 6) {
                                onSignInWithEmail(emailInput, passwordInput)
                                showAuthDialog = false
                            }
                        },
                        variant = ButtonVariant.EMERALD,
                        modifier = Modifier.weight(1.5f)
                    )
                }
            }
        }
    }

    // Reset Confirmation Dialog
    if (showResetDialog) {
        BasicAlertDialog(
            onDismissRequest = { showResetDialog = false },
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .clip(RoundedCornerShape(16.dp))
                .background(Zinc900)
                .border(1.dp, Zinc800, RoundedCornerShape(16.dp))
                .padding(20.dp)
        ) {
            Column {
                Text(
                    text = "Reset Game Data?",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Red500
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "This will restore your companion to default baby stage and reset focus session logs.",
                    fontSize = 13.sp,
                    color = Zinc400
                )
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ShadcnButton(
                        text = "Cancel",
                        onClick = { showResetDialog = false },
                        variant = ButtonVariant.GHOST,
                        modifier = Modifier.weight(1f)
                    )
                    ShadcnButton(
                        text = "Confirm Reset",
                        onClick = {
                            onResetData()
                            showResetDialog = false
                        },
                        variant = ButtonVariant.DESTRUCTIVE,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}
