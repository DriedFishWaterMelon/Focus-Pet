package com.example.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.data.model.ItemCategory
import com.example.data.model.Pet
import com.example.data.model.PetStage
import com.example.data.model.ScreenFreeSession
import com.example.data.model.InventoryItem

@Entity(tableName = "pet_profile")
data class PetEntity(
    @PrimaryKey val id: Int = 1,
    val name: String,
    val species: String,
    val hunger: Float,
    val happiness: Float,
    val energy: Float,
    val exp: Int,
    val level: Int,
    val stageName: String,
    val totalFocusMinutes: Int,
    val streakDays: Int,
    val coins: Int,
    val lastFedTimestamp: Long,
    val lastFocusTimestamp: Long
) {
    fun toDomain(): Pet = Pet(
        id = id,
        name = name,
        species = species,
        hunger = hunger,
        happiness = happiness,
        energy = energy,
        exp = exp,
        level = level,
        stage = PetStage.valueOf(stageName),
        totalFocusMinutes = totalFocusMinutes,
        streakDays = streakDays,
        coins = coins,
        lastFedTimestamp = lastFedTimestamp,
        lastFocusTimestamp = lastFocusTimestamp
    )

    companion object {
        fun fromDomain(pet: Pet): PetEntity = PetEntity(
            id = pet.id,
            name = pet.name,
            species = pet.species,
            hunger = pet.hunger,
            happiness = pet.happiness,
            energy = pet.energy,
            exp = pet.exp,
            level = pet.level,
            stageName = pet.stage.name,
            totalFocusMinutes = pet.totalFocusMinutes,
            streakDays = pet.streakDays,
            coins = pet.coins,
            lastFedTimestamp = pet.lastFedTimestamp,
            lastFocusTimestamp = pet.lastFocusTimestamp
        )
    }
}

@Entity(tableName = "sessions")
data class SessionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val targetMinutes: Int,
    val actualMinutes: Int,
    val startTime: Long,
    val endTime: Long,
    val completed: Boolean,
    val expEarned: Int,
    val coinsEarned: Int,
    val itemRewardName: String?,
    val tag: String
) {
    fun toDomain(): ScreenFreeSession = ScreenFreeSession(
        id = id,
        targetMinutes = targetMinutes,
        actualMinutes = actualMinutes,
        startTime = startTime,
        endTime = endTime,
        completed = completed,
        expEarned = expEarned,
        coinsEarned = coinsEarned,
        itemRewardName = itemRewardName,
        tag = tag
    )

    companion object {
        fun fromDomain(session: ScreenFreeSession): SessionEntity = SessionEntity(
            id = session.id,
            targetMinutes = session.targetMinutes,
            actualMinutes = session.actualMinutes,
            startTime = session.startTime,
            endTime = session.endTime,
            completed = session.completed,
            expEarned = session.expEarned,
            coinsEarned = session.coinsEarned,
            itemRewardName = session.itemRewardName,
            tag = session.tag
        )
    }
}

@Entity(tableName = "inventory")
data class InventoryEntity(
    @PrimaryKey val id: String,
    val name: String,
    val categoryName: String,
    val iconEmoji: String,
    val quantity: Int,
    val hungerBoost: Float,
    val happinessBoost: Float,
    val energyBoost: Float,
    val description: String,
    val price: Int
) {
    fun toDomain(): InventoryItem = InventoryItem(
        id = id,
        name = name,
        category = ItemCategory.valueOf(categoryName),
        iconEmoji = iconEmoji,
        quantity = quantity,
        hungerBoost = hungerBoost,
        happinessBoost = happinessBoost,
        energyBoost = energyBoost,
        description = description,
        price = price
    )

    companion object {
        fun fromDomain(item: InventoryItem): InventoryEntity = InventoryEntity(
            id = item.id,
            name = item.name,
            categoryName = item.category.name,
            iconEmoji = item.iconEmoji,
            quantity = item.quantity,
            hungerBoost = item.hungerBoost,
            happinessBoost = item.happinessBoost,
            energyBoost = item.energyBoost,
            description = item.description,
            price = item.price
        )
    }
}
