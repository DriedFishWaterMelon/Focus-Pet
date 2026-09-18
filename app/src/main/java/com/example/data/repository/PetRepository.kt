package com.example.data.repository

import com.example.data.local.AppDatabase
import com.example.data.local.InventoryEntity
import com.example.data.local.PetEntity
import com.example.data.local.SessionEntity
import com.example.data.model.InventoryItem
import com.example.data.model.Pet
import com.example.data.model.PetStage
import com.example.data.model.ScreenFreeSession
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class PetRepository(private val database: AppDatabase) {

    val pet: Flow<Pet> = database.petDao().getPet().map { entity ->
        entity?.toDomain() ?: Pet()
    }

    val sessions: Flow<List<ScreenFreeSession>> = database.sessionDao().getAllSessions().map { list ->
        list.map { it.toDomain() }
    }

    val inventory: Flow<List<InventoryItem>> = database.inventoryDao().getAllItems().map { list ->
        list.map { it.toDomain() }
    }

    val totalCompletedMinutes: Flow<Int> = database.sessionDao().getTotalCompletedMinutes().map {
        it ?: 0
    }

    suspend fun savePet(pet: Pet) {
        database.petDao().insertOrUpdatePet(PetEntity.fromDomain(pet))
    }

    suspend fun feedPet(currentPet: Pet, item: InventoryItem): Boolean {
        if (item.quantity <= 0) return false

        // Update inventory quantity
        val newQuantity = item.quantity - 1
        database.inventoryDao().updateQuantity(item.id, newQuantity)

        // Boost pet stats
        val newHunger = (currentPet.hunger + item.hungerBoost).coerceIn(0f, 100f)
        val newHappiness = (currentPet.happiness + item.happinessBoost).coerceIn(0f, 100f)
        val newEnergy = (currentPet.energy + item.energyBoost).coerceIn(0f, 100f)
        val newExp = currentPet.exp + 10
        val newLevel = 1 + (newExp / 100)
        val newStage = PetStage.fromLevel(newLevel)

        val updatedPet = currentPet.copy(
            hunger = newHunger,
            happiness = newHappiness,
            energy = newEnergy,
            exp = newExp,
            level = newLevel,
            stage = newStage,
            lastFedTimestamp = System.currentTimeMillis()
        )
        savePet(updatedPet)
        return true
    }

    suspend fun playWithPet(currentPet: Pet): Pet {
        val newHappiness = (currentPet.happiness + 15f).coerceIn(0f, 100f)
        val newEnergy = (currentPet.energy - 8f).coerceIn(0f, 100f)
        val newExp = currentPet.exp + 5
        val newLevel = 1 + (newExp / 100)
        val newStage = PetStage.fromLevel(newLevel)

        val updatedPet = currentPet.copy(
            happiness = newHappiness,
            energy = newEnergy,
            exp = newExp,
            level = newLevel,
            stage = newStage
        )
        savePet(updatedPet)
        return updatedPet
    }

    suspend fun completeFocusSession(
        currentPet: Pet,
        targetMinutes: Int,
        actualMinutes: Int,
        tag: String
    ): Pair<ScreenFreeSession, Pet> {
        val expEarned = actualMinutes * 2 + if (actualMinutes >= targetMinutes) 20 else 5
        val coinsEarned = actualMinutes + (actualMinutes / 5) * 2

        // Reward item roll if session was >= 15 minutes
        val rewardItemName = when {
            actualMinutes >= 45 -> "Golden Honey Apple"
            actualMinutes >= 25 -> "Matcha Focus Brew"
            actualMinutes >= 15 -> "Crisp Forest Berry"
            else -> null
        }

        // Add item to inventory if rewarded
        if (rewardItemName != null) {
            val itemId = when (rewardItemName) {
                "Golden Honey Apple" -> "golden_apple"
                "Matcha Focus Brew" -> "energy_potion"
                else -> "berry_crisp"
            }
            // Add quantity
            val items = database.inventoryDao().getAllItems()
            // will increment quantity for this item
            val existing = items.map { list -> list.find { it.id == itemId } }
            // Let's do a direct update
            database.inventoryDao().insertOrUpdateItem(
                InventoryEntity(
                    id = itemId,
                    name = rewardItemName,
                    categoryName = if (itemId == "energy_potion") "POTION" else "FOOD",
                    iconEmoji = if (itemId == "energy_potion") "🍵" else if (itemId == "golden_apple") "🍎" else "🫐",
                    quantity = 3, // replenished
                    hungerBoost = 30f,
                    happinessBoost = 20f,
                    energyBoost = 15f,
                    description = "Rewarded for completing $actualMinutes min screen-free time!",
                    price = 30
                )
            )
        }

        val session = ScreenFreeSession(
            targetMinutes = targetMinutes,
            actualMinutes = actualMinutes,
            startTime = System.currentTimeMillis() - (actualMinutes * 60 * 1000L),
            endTime = System.currentTimeMillis(),
            completed = actualMinutes >= targetMinutes,
            expEarned = expEarned,
            coinsEarned = coinsEarned,
            itemRewardName = rewardItemName,
            tag = tag
        )
        val sessionId = database.sessionDao().insertSession(SessionEntity.fromDomain(session))

        // Update Pet stats
        val totalFocus = currentPet.totalFocusMinutes + actualMinutes
        val newExp = currentPet.exp + expEarned
        val newLevel = 1 + (newExp / 100)
        val newStage = PetStage.fromLevel(newLevel)
        val newHappiness = (currentPet.happiness + 20f).coerceIn(0f, 100f)
        val newEnergy = (currentPet.energy + 15f).coerceIn(0f, 100f) // Screen-free time rejuvenates energy!
        val newCoins = currentPet.coins + coinsEarned
        val newStreak = currentPet.streakDays + 1

        val updatedPet = currentPet.copy(
            totalFocusMinutes = totalFocus,
            exp = newExp,
            level = newLevel,
            stage = newStage,
            happiness = newHappiness,
            energy = newEnergy,
            coins = newCoins,
            streakDays = newStreak,
            lastFocusTimestamp = System.currentTimeMillis()
        )
        savePet(updatedPet)

        return Pair(session.copy(id = sessionId), updatedPet)
    }

    suspend fun renamePet(currentPet: Pet, newName: String) {
        val updated = currentPet.copy(name = newName)
        savePet(updated)
    }

    suspend fun changePetSpecies(currentPet: Pet, newSpecies: String) {
        val updated = currentPet.copy(species = newSpecies)
        savePet(updated)
    }

    suspend fun resetAllData() {
        database.sessionDao().clearSessions()
        AppDatabase.populateInitialData(database)
    }
}
