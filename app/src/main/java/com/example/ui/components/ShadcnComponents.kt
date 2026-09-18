package com.example.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.Amber400
import com.example.ui.theme.Amber500
import com.example.ui.theme.Emerald400
import com.example.ui.theme.Emerald500
import com.example.ui.theme.Red500
import com.example.ui.theme.Rose400
import com.example.ui.theme.Rose500
import com.example.ui.theme.Violet400
import com.example.ui.theme.Violet500
import com.example.ui.theme.Zinc100
import com.example.ui.theme.Zinc200
import com.example.ui.theme.Zinc400
import com.example.ui.theme.Zinc50
import com.example.ui.theme.Zinc700
import com.example.ui.theme.Zinc800
import com.example.ui.theme.Zinc900
import com.example.ui.theme.Zinc950

// shadcn Card
@Composable
fun ShadcnCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(16.dp),
    backgroundColor: Color = Zinc900,
    borderColor: Color = Zinc800,
    borderWidth: Dp = 1.dp,
    content: @Composable ColumnScope.() -> Unit
) {
    Surface(
        modifier = modifier
            .clip(shape)
            .border(borderWidth, borderColor, shape),
        color = backgroundColor,
        shape = shape
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            content = content
        )
    }
}

// shadcn Badge
enum class BadgeVariant {
    DEFAULT,
    SECONDARY,
    OUTLINE,
    SUCCESS,
    WARNING,
    DESTRUCTIVE,
    VIOLET
}

@Composable
fun ShadcnBadge(
    text: String,
    modifier: Modifier = Modifier,
    variant: BadgeVariant = BadgeVariant.DEFAULT,
    icon: ImageVector? = null
) {
    val (bg, fg, border) = when (variant) {
        BadgeVariant.DEFAULT -> Triple(Zinc50, Zinc950, Zinc50)
        BadgeVariant.SECONDARY -> Triple(Zinc800, Zinc300(), Zinc800)
        BadgeVariant.OUTLINE -> Triple(Color.Transparent, Zinc300(), Zinc800)
        BadgeVariant.SUCCESS -> Triple(Emerald500.copy(alpha = 0.18f), Emerald400, Emerald500.copy(alpha = 0.35f))
        BadgeVariant.WARNING -> Triple(Amber500.copy(alpha = 0.18f), Amber400, Amber500.copy(alpha = 0.35f))
        BadgeVariant.DESTRUCTIVE -> Triple(Red500.copy(alpha = 0.18f), Red500, Red500.copy(alpha = 0.35f))
        BadgeVariant.VIOLET -> Triple(Violet500.copy(alpha = 0.18f), Violet400, Violet500.copy(alpha = 0.35f))
    }

    Row(
        modifier = modifier
            .clip(CircleShape)
            .background(bg)
            .border(1.dp, border, CircleShape)
            .padding(horizontal = 9.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = fg,
                modifier = Modifier
                    .size(12.dp)
                    .padding(end = 4.dp)
            )
        }
        Text(
            text = text,
            color = fg,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            letterSpacing = 0.2.sp
        )
    }
}

private fun Zinc300(): Color = Color(0xFFD4D4D8)

// shadcn Button
enum class ButtonVariant {
    DEFAULT,
    SECONDARY,
    OUTLINE,
    GHOST,
    DESTRUCTIVE,
    EMERALD
}

@Composable
fun ShadcnButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.DEFAULT,
    enabled: Boolean = true,
    icon: ImageVector? = null,
    testTag: String = "shadcn_button"
) {
    val (bgColor, textColor, borderColor) = when (variant) {
        ButtonVariant.DEFAULT -> Triple(Zinc50, Zinc950, Color.Transparent)
        ButtonVariant.SECONDARY -> Triple(Zinc800, Zinc50, Color.Transparent)
        ButtonVariant.OUTLINE -> Triple(Color.Transparent, Zinc50, Zinc700)
        ButtonVariant.GHOST -> Triple(Color.Transparent, Zinc400, Color.Transparent)
        ButtonVariant.DESTRUCTIVE -> Triple(Red500, Zinc50, Color.Transparent)
        ButtonVariant.EMERALD -> Triple(Emerald500, Zinc950, Color.Transparent)
    }

    val finalBg = if (enabled) bgColor else Zinc800.copy(alpha = 0.5f)
    val finalFg = if (enabled) textColor else Zinc500()

    Surface(
        modifier = modifier
            .testTag(testTag)
            .minimumInteractiveComponentSize()
            .clip(RoundedCornerShape(10.dp))
            .border(
                if (borderColor != Color.Transparent) 1.dp else 0.dp,
                borderColor,
                RoundedCornerShape(10.dp)
            )
            .clickable(
                enabled = enabled,
                interactionSource = remember { MutableInteractionSource() },
                indication = androidx.compose.material3.ripple(color = finalFg)
            ) { onClick() },
        color = finalBg,
        shape = RoundedCornerShape(10.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = finalFg,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text(
                text = text,
                color = finalFg,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.1.sp
            )
        }
    }
}

private fun Zinc500(): Color = Color(0xFF71717A)

// shadcn Progress Bar
@Composable
fun ShadcnProgressBar(
    value: Float, // 0f to 1f
    modifier: Modifier = Modifier,
    barColor: Color = Emerald500,
    backgroundColor: Color = Zinc800,
    height: Dp = 8.dp
) {
    val progressClamped = value.coerceIn(0f, 1f)
    val animatedProgress by animateFloatAsState(
        targetValue = progressClamped,
        animationSpec = tween(durationMillis = 400),
        label = "progress_anim"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clip(CircleShape)
            .background(backgroundColor)
    ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(animatedProgress)
                .clip(CircleShape)
                .background(barColor)
        )
    }
}

// Stat Row with Label, Progress bar, and Value
@Composable
fun ShadcnStatBar(
    label: String,
    current: Float,
    max: Float = 100f,
    icon: String,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    val ratio = (current / max).coerceIn(0f, 1f)
    val percentText = "${current.toInt()}%"

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(text = icon, fontSize = 14.sp)
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = label,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = Zinc300()
                )
            }
            Text(
                text = percentText,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = accentColor
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        ShadcnProgressBar(
            value = ratio,
            barColor = accentColor,
            height = 7.dp
        )
    }
}
