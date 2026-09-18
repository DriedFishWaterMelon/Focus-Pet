package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface PetDao {
    @Query("SELECT * FROM pet_profile WHERE id = 1 LIMIT 1")
    fun getPet(): Flow<PetEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdatePet(pet: PetEntity)

    @Update
    suspend fun updatePet(pet: PetEntity)
}

@Dao
interface SessionDao {
    @Query("SELECT * FROM sessions ORDER BY endTime DESC")
    fun getAllSessions(): Flow<List<SessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: SessionEntity): Long

    @Query("SELECT SUM(actualMinutes) FROM sessions WHERE completed = 1")
    fun getTotalCompletedMinutes(): Flow<Int?>

    @Query("DELETE FROM sessions")
    suspend fun clearSessions()
}

@Dao
interface InventoryDao {
    @Query("SELECT * FROM inventory ORDER BY categoryName ASC")
    fun getAllItems(): Flow<List<InventoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateItem(item: InventoryEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<InventoryEntity>)

    @Query("UPDATE inventory SET quantity = :quantity WHERE id = :id")
    suspend fun updateQuantity(id: String, quantity: Int)
}
