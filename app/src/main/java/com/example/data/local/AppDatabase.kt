package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [PetEntity::class, SessionEntity::class, InventoryEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun petDao(): PetDao
    abstract fun sessionDao(): SessionDao
    abstract fun inventoryDao(): InventoryDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope = CoroutineScope(Dispatchers.IO)): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "focus_pet_database"
                )
                    .fallbackToDestructiveMigration()
                    .addCallback(DatabaseCallback(scope))
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialData(database)
                    }
                }
            }
        }

        suspend fun populateInitialData(database: AppDatabase) {
            // Initial Pet
            val defaultPet = PetEntity(
                id = 1,
                name = "Sproutly",
                species = "Leafy Sprout",
                hunger = 85f,
                happiness = 90f,
                energy = 85f,
                exp = 80,
                level = 1,
                stageName = "BABY",
                totalFocusMinutes = 45,
                streakDays = 2,
                coins = 150,
                lastFedTimestamp = System.currentTimeMillis(),
                lastFocusTimestamp = System.currentTimeMillis()
            )
            database.petDao().insertOrUpdatePet(defaultPet)

            // Initial Inventory
            val initialItems = listOf(
                InventoryEntity(
                    id = "berry_crisp",
                    name = "Crisp Forest Berry",
                    categoryName = "FOOD",
                    iconEmoji = "🫐",
                    quantity = 5,
                    hungerBoost = 25f,
                    happinessBoost = 15f,
                    energyBoost = 10f,
                    description = "Sweet organic berry collected during screen-free nature walks.",
                    price = 25
                ),
                InventoryEntity(
                    id = "golden_apple",
                    name = "Golden Honey Apple",
                    categoryName = "FOOD",
                    iconEmoji = "🍎",
                    quantity = 2,
                    hungerBoost = 50f,
                    happinessBoost = 30f,
                    energyBoost = 25f,
                    description = "Rare fruit that nourishes body and mind. Huge vitality boost!",
                    price = 60
                ),
                InventoryEntity(
                    id = "energy_potion",
                    name = "Matcha Focus Brew",
                    categoryName = "POTION",
                    iconEmoji = "🍵",
                    quantity = 3,
                    hungerBoost = 5f,
                    happinessBoost = 20f,
                    energyBoost = 45f,
                    description = "Concentrated green elixir that revitalizes pet stamina.",
                    price = 45
                ),
                InventoryEntity(
                    id = "yarn_ball",
                    name = "Glow Feather Toy",
                    categoryName = "TOY",
                    iconEmoji = "🪶",
                    quantity = 1,
                    hungerBoost = -5f,
                    happinessBoost = 35f,
                    energyBoost = -10f,
                    description = "Interactive toy that makes your companion jump with joy!",
                    price = 50
                ),
                InventoryEntity(
                    id = "star_crystal",
                    name = "Celestial Stardust",
                    categoryName = "BADGE",
                    iconEmoji = "⭐",
                    quantity = 1,
                    hungerBoost = 10f,
                    happinessBoost = 50f,
                    energyBoost = 30f,
                    description = "Mythic stardust dropped after achieving 60+ min focus sessions.",
                    price = 100
                )
            )
            database.inventoryDao().insertAll(initialItems)

            // Initial Sample Session
            val pastSession = SessionEntity(
                targetMinutes = 30,
                actualMinutes = 30,
                startTime = System.currentTimeMillis() - (24 * 3600 * 1000L),
                endTime = System.currentTimeMillis() - (24 * 3600 * 1000L) + (30 * 60 * 1000L),
                completed = true,
                expEarned = 60,
                coinsEarned = 35,
                itemRewardName = "Crisp Forest Berry",
                tag = "Study"
            )
            database.sessionDao().insertSession(pastSession)
        }
    }
}
