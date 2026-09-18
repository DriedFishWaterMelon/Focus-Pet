package com.example.data.model

enum class PetStage(val displayName: String, val minLevel: Int) {
    BABY("Baby Sprout", 1),
    JUVENILE("Playful Sprout", 3),
    ADULT("Guardian Beast", 6),
    MYSTIC("Mystic Elder", 10),
    LEGEND("Celestial Spirit", 15);

    companion object {
        fun fromLevel(level: Int): PetStage {
            return when {
                level >= 15 -> LEGEND
                level >= 10 -> MYSTIC
                level >= 6 -> ADULT
                level >= 3 -> JUVENILE
                else -> BABY
            }
        }
    }
}

enum class PetMood(val emoji: String, val label: String) {
    ECSTATIC("✨", "Ecstatic & Blooming"),
    HAPPY("😊", "Happy & Energetic"),
    CONTENT("🌿", "Calm & Peaceful"),
    HUNGRY("🍽️", "Tummy is Rumbling"),
    TIRED("😴", "Drowsy & Resting"),
    MEDITATING("🧘", "In Deep Focus")
}

data class Pet(
    val id: Int = 1,
    val name: String = "Sproutly",
    val species: String = "Leafy Dragon",
    val hunger: Float = 85f,      // 0 to 100
    val happiness: Float = 90f,   // 0 to 100
    val energy: Float = 80f,      // 0 to 100
    val exp: Int = 120,
    val level: Int = 2,
    val stage: PetStage = PetStage.BABY,
    val totalFocusMinutes: Int = 145,
    val streakDays: Int = 3,
    val coins: Int = 250,
    val lastFedTimestamp: Long = System.currentTimeMillis(),
    val lastFocusTimestamp: Long = System.currentTimeMillis()
) {
    val expForNextLevel: Int
        get() = level * 100

    val expProgress: Float
        get() = (exp % 100).toFloat() / 100f

    val mood: PetMood
        get() = when {
            hunger < 30f -> PetMood.HUNGRY
            energy < 25f -> PetMood.TIRED
            happiness >= 80f && hunger >= 70f -> PetMood.ECSTATIC
            happiness >= 50f -> PetMood.HAPPY
            else -> PetMood.CONTENT
        }
}

data class ScreenFreeSession(
    val id: Long = 0,
    val targetMinutes: Int,
    val actualMinutes: Int,
    val startTime: Long,
    val endTime: Long,
    val completed: Boolean,
    val expEarned: Int,
    val coinsEarned: Int,
    val itemRewardName: String? = null,
    val tag: String = "Deep Work"
)

enum class ItemCategory {
    FOOD,
    TOY,
    POTION,
    BADGE
}

data class InventoryItem(
    val id: String,
    val name: String,
    val category: ItemCategory,
    val iconEmoji: String,
    val quantity: Int,
    val hungerBoost: Float = 0f,
    val happinessBoost: Float = 0f,
    val energyBoost: Float = 0f,
    val description: String,
    val price: Int = 20
)
