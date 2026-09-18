package com.example.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.data.model.Pet
import com.example.data.model.PetMood
import com.example.data.model.PetStage
import com.example.ui.theme.Amber400
import com.example.ui.theme.Amber500
import com.example.ui.theme.Emerald400
import com.example.ui.theme.Emerald500
import com.example.ui.theme.Rose400
import com.example.ui.theme.Rose500
import com.example.ui.theme.Violet400
import com.example.ui.theme.Violet500
import com.example.ui.theme.Zinc950

@Composable
fun PetVisualCanvas(
    pet: Pet,
    isFocusing: Boolean = false,
    isEating: Boolean = false,
    onPetTap: () -> Unit = {},
    modifier: Modifier = Modifier,
    canvasSize: Dp = 200.dp
) {
    // Breathing & Idle Bounce Animation
    val infiniteTransition = rememberInfiniteTransition(label = "pet_breath_transition")

    val breatheScale by infiniteTransition.animateFloat(
        initialValue = 0.97f,
        targetValue = 1.03f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "breathe_scale"
    )

    val earSway by infiniteTransition.animateFloat(
        initialValue = -5f,
        targetValue = 5f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "ear_sway"
    )

    val auraPulse by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.75f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "aura_pulse"
    )

    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float_offset"
    )

    Box(
        modifier = modifier
            .size(canvasSize)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) { onPetTap() },
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val canvasW = size.width
            val canvasH = size.height
            val centerX = canvasW / 2f
            val centerY = canvasH / 2f + floatOffset

            // Stage color tones
            val (bodyPrimary, bodySecondary, auraColor) = when (pet.stage) {
                PetStage.BABY -> Triple(Emerald400, Emerald500, Emerald400.copy(alpha = 0.25f))
                PetStage.JUVENILE -> Triple(Color(0xFF34D399), Color(0xFF059669), Emerald500.copy(alpha = 0.3f))
                PetStage.ADULT -> Triple(Amber400, Amber500, Amber400.copy(alpha = 0.35f))
                PetStage.MYSTIC -> Triple(Violet400, Violet500, Violet400.copy(alpha = 0.4f))
                PetStage.LEGEND -> Triple(Color(0xFF38BDF8), Color(0xFF6366F1), Color(0xFF818CF8).copy(alpha = 0.5f))
            }

            // 1. Aura Glow (especially when focusing or mystic/legend)
            val auraRadius = (canvasW * 0.38f) * (if (isFocusing) (1.1f + auraPulse * 0.15f) else (1.0f + auraPulse * 0.08f))
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(auraColor, Color.Transparent),
                    center = Offset(centerX, centerY),
                    radius = auraRadius
                ),
                radius = auraRadius,
                center = Offset(centerX, centerY)
            )

            // Stage decorative features: Mystic / Legend Halo Rings
            if (pet.stage == PetStage.MYSTIC || pet.stage == PetStage.LEGEND) {
                drawCircle(
                    color = Violet400.copy(alpha = 0.6f),
                    radius = canvasW * 0.42f,
                    center = Offset(centerX, centerY - 15f),
                    style = Stroke(width = 3f)
                )
            }

            // 2. Pet Ears / Horns / Wings
            val earWidth = canvasW * 0.12f
            val earHeight = canvasH * 0.2f
            val earY = centerY - canvasH * 0.28f

            // Left Ear
            val leftEarPath = Path().apply {
                moveTo(centerX - canvasW * 0.22f, centerY - canvasH * 0.1f)
                quadraticBezierTo(
                    centerX - canvasW * 0.3f + earSway,
                    earY - 10f,
                    centerX - canvasW * 0.12f,
                    centerY - canvasH * 0.22f
                )
                close()
            }
            drawPath(leftEarPath, bodySecondary)

            // Right Ear
            val rightEarPath = Path().apply {
                moveTo(centerX + canvasW * 0.22f, centerY - canvasH * 0.1f)
                quadraticBezierTo(
                    centerX + canvasW * 0.3f - earSway,
                    earY - 10f,
                    centerX + canvasW * 0.12f,
                    centerY - canvasH * 0.22f
                )
                close()
            }
            drawPath(rightEarPath, bodySecondary)

            // 3. Pet Main Body (Soft rounded teardrop / capsule creature)
            val bodyRadiusX = (canvasW * 0.32f) * breatheScale
            val bodyRadiusY = (canvasH * 0.30f) * (1f / breatheScale)

            drawRoundRect(
                brush = Brush.verticalGradient(
                    colors = listOf(bodyPrimary, bodySecondary),
                    startY = centerY - bodyRadiusY,
                    endY = centerY + bodyRadiusY
                ),
                topLeft = Offset(centerX - bodyRadiusX, centerY - bodyRadiusY),
                size = Size(bodyRadiusX * 2f, bodyRadiusY * 2f),
                cornerRadius = CornerRadius(bodyRadiusX * 0.85f, bodyRadiusY * 0.95f)
            )

            // Belly Patch (Soft cream / mint)
            val bellyW = bodyRadiusX * 1.15f
            val bellyH = bodyRadiusY * 0.95f
            drawRoundRect(
                color = Color.White.copy(alpha = 0.22f),
                topLeft = Offset(centerX - bellyW / 2f, centerY - bellyH / 2f + 15f),
                size = Size(bellyW, bellyH),
                cornerRadius = CornerRadius(bellyW / 2f, bellyH / 2f)
            )

            // 4. Head Sprout / Leaf or Horn on top
            val sproutBaseX = centerX
            val sproutBaseY = centerY - bodyRadiusY + 4f
            val leafPath = Path().apply {
                moveTo(sproutBaseX, sproutBaseY)
                cubicTo(
                    sproutBaseX - 18f + earSway, sproutBaseY - 32f,
                    sproutBaseX - 25f, sproutBaseY - 48f,
                    sproutBaseX + earSway, sproutBaseY - 55f
                )
                cubicTo(
                    sproutBaseX + 18f, sproutBaseY - 45f,
                    sproutBaseX + 10f, sproutBaseY - 25f,
                    sproutBaseX, sproutBaseY
                )
                close()
            }
            drawPath(leafPath, if (pet.stage == PetStage.BABY) Emerald400 else Amber400)

            // 5. Face Elements
            val eyeSpacing = bodyRadiusX * 0.45f
            val eyeY = centerY - bodyRadiusY * 0.2f
            val eyeRadius = bodyRadiusX * 0.12f

            if (isFocusing) {
                // Meditating / Screen-Free Focused: Content closed curved peaceful eyes ^_^
                val leftEyePath = Path().apply {
                    moveTo(centerX - eyeSpacing - eyeRadius, eyeY)
                    quadraticBezierTo(centerX - eyeSpacing, eyeY - eyeRadius * 1.2f, centerX - eyeSpacing + eyeRadius, eyeY)
                }
                val rightEyePath = Path().apply {
                    moveTo(centerX + eyeSpacing - eyeRadius, eyeY)
                    quadraticBezierTo(centerX + eyeSpacing, eyeY - eyeRadius * 1.2f, centerX + eyeSpacing + eyeRadius, eyeY)
                }
                drawPath(leftEyePath, Zinc950, style = Stroke(width = 5f))
                drawPath(rightEyePath, Zinc950, style = Stroke(width = 5f))
            } else if (pet.mood == PetMood.TIRED) {
                // Sleepy eyes
                val leftEyePath = Path().apply {
                    moveTo(centerX - eyeSpacing - eyeRadius, eyeY)
                    lineTo(centerX - eyeSpacing + eyeRadius, eyeY)
                }
                val rightEyePath = Path().apply {
                    moveTo(centerX + eyeSpacing - eyeRadius, eyeY)
                    lineTo(centerX + eyeSpacing + eyeRadius, eyeY)
                }
                drawPath(leftEyePath, Zinc950, style = Stroke(width = 4.5f))
                drawPath(rightEyePath, Zinc950, style = Stroke(width = 4.5f))
            } else {
                // Big shiny anime / kawaii companion eyes
                drawCircle(
                    color = Zinc950,
                    radius = eyeRadius,
                    center = Offset(centerX - eyeSpacing, eyeY)
                )
                drawCircle(
                    color = Zinc950,
                    radius = eyeRadius,
                    center = Offset(centerX + eyeSpacing, eyeY)
                )
                // Eye highlights (sparkling reflection)
                drawCircle(
                    color = Color.White,
                    radius = eyeRadius * 0.42f,
                    center = Offset(centerX - eyeSpacing - eyeRadius * 0.25f, eyeY - eyeRadius * 0.25f)
                )
                drawCircle(
                    color = Color.White,
                    radius = eyeRadius * 0.42f,
                    center = Offset(centerX + eyeSpacing - eyeRadius * 0.25f, eyeY - eyeRadius * 0.25f)
                )
            }

            // Cheeks (Blush)
            val cheekY = eyeY + eyeRadius * 1.3f
            drawCircle(
                color = Rose400.copy(alpha = 0.55f),
                radius = eyeRadius * 0.9f,
                center = Offset(centerX - eyeSpacing - eyeRadius * 1.2f, cheekY)
            )
            drawCircle(
                color = Rose400.copy(alpha = 0.55f),
                radius = eyeRadius * 0.9f,
                center = Offset(centerX + eyeSpacing + eyeRadius * 1.2f, cheekY)
            )

            // Mouth
            val mouthY = eyeY + eyeRadius * 1.4f
            if (isEating) {
                // Open happy eating mouth
                drawCircle(
                    color = Rose500,
                    radius = eyeRadius * 0.8f,
                    center = Offset(centerX, mouthY + 5f)
                )
            } else if (pet.mood == PetMood.HUNGRY) {
                // Small sad / hungry wavy mouth
                val hungryMouth = Path().apply {
                    moveTo(centerX - 10f, mouthY + 8f)
                    quadraticBezierTo(centerX, mouthY + 2f, centerX + 10f, mouthY + 8f)
                }
                drawPath(hungryMouth, Zinc950, style = Stroke(width = 4f))
            } else {
                // Cute cat / puppy smile :3
                val smilePath = Path().apply {
                    moveTo(centerX - 12f, mouthY)
                    quadraticBezierTo(centerX - 6f, mouthY + 8f, centerX, mouthY + 3f)
                    quadraticBezierTo(centerX + 6f, mouthY + 8f, centerX + 12f, mouthY)
                }
                drawPath(smilePath, Zinc950, style = Stroke(width = 4f))
            }

            // Paws at bottom
            val pawY = centerY + bodyRadiusY - 8f
            val pawRadius = bodyRadiusX * 0.2f
            drawCircle(
                color = bodySecondary,
                radius = pawRadius,
                center = Offset(centerX - bodyRadiusX * 0.45f, pawY)
            )
            drawCircle(
                color = bodySecondary,
                radius = pawRadius,
                center = Offset(centerX + bodyRadiusX * 0.45f, pawY)
            )
        }
    }
}
