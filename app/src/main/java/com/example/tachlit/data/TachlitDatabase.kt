package com.example.tachlit.data

import androidx.room.*
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [User::class, LearnAsker::class, LearnGiver::class, Pairing::class, OfficeVolunteer::class, FoodVolunteer::class],
    version = 3,
    exportSchema = false
)
abstract class TachlitDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun learnAskerDao(): LearnAskerDao
    abstract fun learnGiverDao(): LearnGiverDao
    abstract fun pairingDao(): PairingDao
    abstract fun officeVolunteerDao(): OfficeVolunteerDao
    abstract fun foodVolunteerDao(): FoodVolunteerDao

    companion object {
        @Volatile
        private var INSTANCE: TachlitDatabase? = null

        fun getDatabase(context: android.content.Context): TachlitDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    TachlitDatabase::class.java,
                    "tachlit_database"
                ).fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
