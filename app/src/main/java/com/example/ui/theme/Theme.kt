package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = Zinc50,
    onPrimary = Zinc950,
    primaryContainer = Zinc800,
    onPrimaryContainer = Zinc50,
    secondary = Zinc700,
    onSecondary = Zinc50,
    secondaryContainer = Zinc900,
    onSecondaryContainer = Zinc300,
    tertiary = Emerald400,
    onTertiary = Zinc950,
    background = Zinc950,
    onBackground = Zinc50,
    surface = Zinc900,
    onSurface = Zinc50,
    surfaceVariant = Zinc800,
    onSurfaceVariant = Zinc400,
    outline = Zinc800,
    outlineVariant = Zinc700,
    error = Red500,
    onError = Zinc50
)

private val LightColorScheme = lightColorScheme(
    primary = Zinc950,
    onPrimary = Zinc50,
    primaryContainer = Zinc200,
    onPrimaryContainer = Zinc950,
    secondary = Zinc200,
    onSecondary = Zinc900,
    secondaryContainer = Zinc100,
    onSecondaryContainer = Zinc700,
    tertiary = Emerald500,
    onTertiary = Zinc50,
    background = Zinc50,
    onBackground = Zinc950,
    surface = Zinc50,
    onSurface = Zinc950,
    surfaceVariant = Zinc100,
    onSurfaceVariant = Zinc600,
    outline = Zinc300,
    outlineVariant = Zinc200,
    error = Red500,
    onError = Zinc50
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = true, // Default to sleek shadcn dark theme
    dynamicColor: Boolean = false, // Keep shadcn zinc aesthetic consistent
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
