package com.example.tachlit.data

import androidx.room.*
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [User::class, LearnAsker::class, LearnGiver::class, Pairing::class, OfficeVolunteer::class, FoodVolunteer::class],
    version = 5, // Keep this at 5, you won't need to change it again
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
                )
                .fallbackToDestructiveMigration() // This handles schema changes automatically
                .allowMainThreadQueries() // For development convenience
                .addCallback(object : RoomDatabase.Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        // Database created fresh - no issues
                    }
                    override fun onOpen(db: SupportSQLiteDatabase) {
                        super.onOpen(db)
                        // Database opened successfully
                    }
                })
                .build()
                INSTANCE = instance
                instance
            }
        }

        // Method to reset database if needed (for development)
        fun resetDatabase(context: android.content.Context) {
            INSTANCE?.close()
            context.deleteDatabase("tachlit_database")
            INSTANCE = null
        }
    }
}
