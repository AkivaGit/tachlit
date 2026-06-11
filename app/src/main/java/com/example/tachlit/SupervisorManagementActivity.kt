package com.example.tachlit

import android.app.AlertDialog
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.tachlit.data.*
import com.example.tachlit.databinding.ActivitySupervisorManagementBinding
import com.example.tachlit.repository.TachlitRepository
import kotlinx.coroutines.launch

class SupervisorManagementActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySupervisorManagementBinding
    private lateinit var learnersAdapter: LearnersAdapter
    private lateinit var teachersAdapter: TeachersAdapter
    private lateinit var repository: TachlitRepository

    companion object {
        const val EXTRA_VIEW_TYPE = "view_type"
        const val VIEW_ALL_USERS = "all_users"
        const val VIEW_UNMATCHED_LEARNERS = "unmatched_learners"
        const val VIEW_AVAILABLE_TEACHERS = "available_teachers"
        const val VIEW_SUGGESTED_MATCHES = "suggested_matches"
    }


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_supervisor_management)

        // Initialize repository
        val database = TachlitDatabase.getDatabase(this)
        repository = TachlitRepository(
            database.userDao(),
            database.learnAskerDao(),
            database.learnGiverDao(),
            database.officeVolunteerDao(),
            database.foodVolunteerDao(),
            database.pairingDao()
        )

        val viewType = intent.getStringExtra(EXTRA_VIEW_TYPE) ?: VIEW_ALL_USERS
        setupUI(viewType)
        setupRecyclerViews()
        loadDataBasedOnViewType(viewType)
    }

    private fun setupUI(viewType: String) {
        // Set title based on view type
        supportActionBar?.title = when (viewType) {
            VIEW_ALL_USERS -> "כל המשתמשים"
            VIEW_UNMATCHED_LEARNERS -> "לומדים שלא שובצו"
            VIEW_AVAILABLE_TEACHERS -> "מורים זמינים"
            VIEW_SUGGESTED_MATCHES -> "הצעות התאמה"
            else -> "ניהול שיבוצים"
        }
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        binding.btnSuggestMatches.setOnClickListener {
            suggestMatches()
        }

        binding.btnFilterByCity.setOnClickListener {
            filterByCity()
        }
    }

    private fun setupRecyclerViews() {
        learnersAdapter = LearnersAdapter { learner, user ->
            onLearnerSelected(learner, user)
        }

        teachersAdapter = TeachersAdapter { teacher, user ->
            onTeacherSelected(teacher, user)
        }

        binding.recyclerViewLearners.apply {
            layoutManager = LinearLayoutManager(this@SupervisorManagementActivity)
            adapter = learnersAdapter
            setHasFixedSize(false)
        }

        binding.recyclerViewTeachers.apply {
            layoutManager = LinearLayoutManager(this@SupervisorManagementActivity)
            adapter = teachersAdapter
            setHasFixedSize(false)
        }
    }

    private fun forceRecyclerViewMeasurement() {
        // Force RecyclerViews to remeasure their content
        binding.recyclerViewLearners.post {
            binding.recyclerViewLearners.requestLayout()
        }
        binding.recyclerViewTeachers.post {
            binding.recyclerViewTeachers.requestLayout()
        }
    }

    private fun loadDataBasedOnViewType(viewType: String) {
        lifecycleScope.launch {
            when (viewType) {
                VIEW_ALL_USERS -> {
                    // Load real data from repository
                    println("[DEBUG_LOG] Loading all users from repository")
                    repository.getAllUsers().collect { users ->
                        // Separate users by type
                        val learners = users.filter { it.userType == UserType.LEARN_ASKER.name }
                        val teachers = users.filter { it.userType == UserType.LEARN_GIVER.name }

                        // For now, create simple pairs with empty LearnAsker/LearnGiver objects
                        val learnerPairs = learners.map { user ->
                            Pair(
                                LearnAsker(userId = user.id, subjects = "", learningGoals = "", preferredSchedule = "", experienceLevel = "Beginner"),
                                user
                            )
                        }

                        val teacherPairs = teachers.map { user ->
                            Pair(
                                LearnGiver(userId = user.id, subjectsCanTeach = "", teachingExperience = "", availableSchedule = "", teachingStyle = ""),
                                user
                            )
                        }

                        learnersAdapter.submitList(learnerPairs)
                        teachersAdapter.submitList(teacherPairs)
                        binding.tvLearnersCount.text = learnerPairs.size.toString()
                        binding.tvTeachersCount.text = teacherPairs.size.toString()
                        binding.tvPairingsCount.text = "0"

                        updateSectionTitles("כל הלומדים", "כל המורים")
                        forceRecyclerViewMeasurement()
                    }
                }
                VIEW_UNMATCHED_LEARNERS -> {
                    repository.getAllUsers().collect { users ->
                        val learners = users.filter { it.userType == UserType.LEARN_ASKER.name }
                        val learnerPairs = learners.map { user ->
                            Pair(
                                LearnAsker(userId = user.id, subjects = "", learningGoals = "", preferredSchedule = "", experienceLevel = "Beginner"),
                                user
                            )
                        }

                        learnersAdapter.submitList(learnerPairs)
                        teachersAdapter.submitList(emptyList())
                        binding.tvLearnersCount.text = learnerPairs.size.toString()
                        binding.tvTeachersCount.text = "0"
                        binding.tvPairingsCount.text = "0"

                        updateSectionTitles("לומדים שלא שובצו", "")
                        forceRecyclerViewMeasurement()
                    }
                }
                VIEW_AVAILABLE_TEACHERS -> {
                    repository.getAllUsers().collect { users ->
                        val teachers = users.filter { it.userType == UserType.LEARN_GIVER.name }
                        val teacherPairs = teachers.map { user ->
                            Pair(
                                LearnGiver(userId = user.id, subjectsCanTeach = "", teachingExperience = "", availableSchedule = "", teachingStyle = ""),
                                user
                            )
                        }

                        learnersAdapter.submitList(emptyList())
                        teachersAdapter.submitList(teacherPairs)
                        binding.tvLearnersCount.text = "0"
                        binding.tvTeachersCount.text = teacherPairs.size.toString()
                        binding.tvPairingsCount.text = "0"

                        updateSectionTitles("", "מורים זמינים")
                        forceRecyclerViewMeasurement()
                    }
                }
                VIEW_SUGGESTED_MATCHES -> {
                    repository.getAllUsers().collect { users ->
                        val learners = users.filter { it.userType == UserType.LEARN_ASKER.name }
                        val teachers = users.filter { it.userType == UserType.LEARN_GIVER.name }

                        val learnerPairs = learners.map { user ->
                            Pair(
                                LearnAsker(userId = user.id, subjects = "", learningGoals = "", preferredSchedule = "", experienceLevel = "Beginner"),
                                user
                            )
                        }

                        val teacherPairs = teachers.map { user ->
                            Pair(
                                LearnGiver(userId = user.id, subjectsCanTeach = "", teachingExperience = "", availableSchedule = "", teachingStyle = ""),
                                user
                            )
                        }

                        learnersAdapter.submitList(learnerPairs)
                        teachersAdapter.submitList(teacherPairs)
                        binding.tvLearnersCount.text = learnerPairs.size.toString()
                        binding.tvTeachersCount.text = teacherPairs.size.toString()
                        binding.tvPairingsCount.text = "0"

                        updateSectionTitles("לומדים לשיבוץ", "מורים זמינים לשיבוץ")
                        forceRecyclerViewMeasurement()
                    }
                }
                else -> {
                    repository.getAllUsers().collect { users ->
                        val learners = users.filter { it.userType == UserType.LEARN_ASKER.name }
                        val teachers = users.filter { it.userType == UserType.LEARN_GIVER.name }

                        val learnerPairs = learners.map { user ->
                            Pair(
                                LearnAsker(userId = user.id, subjects = "", learningGoals = "", preferredSchedule = "", experienceLevel = "Beginner"),
                                user
                            )
                        }

                        val teacherPairs = teachers.map { user ->
                            Pair(
                                LearnGiver(userId = user.id, subjectsCanTeach = "", teachingExperience = "", availableSchedule = "", teachingStyle = ""),
                                user
                            )
                        }

                        learnersAdapter.submitList(learnerPairs)
                        teachersAdapter.submitList(teacherPairs)
                        binding.tvLearnersCount.text = learnerPairs.size.toString()
                        binding.tvTeachersCount.text = teacherPairs.size.toString()
                        binding.tvPairingsCount.text = "0"

                        updateSectionTitles("כל הלומדים", "כל המורים")
                        forceRecyclerViewMeasurement()
                    }
                }
            }
        }
    }

    private fun updateSectionTitles(learnersTitle: String, teachersTitle: String) {
        // Update learners section
        if (learnersTitle.isNotEmpty()) {
            binding.tvLearnersTitle.text = learnersTitle
            findViewById<androidx.cardview.widget.CardView>(R.id.cardViewLearners)?.visibility = android.view.View.VISIBLE
        } else {
            findViewById<androidx.cardview.widget.CardView>(R.id.cardViewLearners)?.visibility = android.view.View.GONE
        }

        // Update teachers section
        if (teachersTitle.isNotEmpty()) {
            binding.tvTeachersTitle.text = teachersTitle
            findViewById<androidx.cardview.widget.CardView>(R.id.cardViewTeachers)?.visibility = android.view.View.VISIBLE
        } else {
            findViewById<androidx.cardview.widget.CardView>(R.id.cardViewTeachers)?.visibility = android.view.View.GONE
        }
    }

    private fun onLearnerSelected(learner: LearnAsker, user: User) {
        showLearnerDetails(learner, user)
    }

    private fun onTeacherSelected(teacher: LearnGiver, user: User) {
        showTeacherDetails(teacher, user)
    }

    private fun showLearnerDetails(learner: LearnAsker, user: User) {
        val message = """
            שם: ${user.name}
            עיר: ${user.city}
            טלפון: ${user.phone}
            מקצועות: ${learner.subjects}
            מטרות: ${learner.learningGoals}
            זמנים: ${learner.preferredSchedule}
            רמה: ${learner.experienceLevel}
            הערות: ${learner.additionalNotes}
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("פרטי הלומד")
            .setMessage(message)
            .setPositiveButton("הצע התאמות") { _, _ ->
                suggestMatchesForLearner(learner, user)
            }
            .setNegativeButton("סגור", null)
            .show()
    }

    private fun showTeacherDetails(teacher: LearnGiver, user: User) {
        val message = """
            שם: ${user.name}
            עיר: ${user.city}
            טלפון: ${user.phone}
            מקצועות: ${teacher.subjectsCanTeach}
            ניסיון: ${teacher.teachingExperience}
            זמנים פנויים: ${teacher.availableSchedule}
            מקסימום תלמידים: ${teacher.maxStudents}
            סגנון הוראה: ${teacher.teachingStyle}
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("פרטי המורה")
            .setMessage(message)
            .setPositiveButton("הצג תלמידים") { _, _ ->
                showTeacherStudents(teacher)
            }
            .setNegativeButton("סגור", null)
            .show()
    }

    private fun suggestMatchesForLearner(learner: LearnAsker, learnerUser: User) {
        // For now, show empty suggestions since we don't have real teacher data
        val suggestions = emptyList<Triple<LearnGiver, User, Int>>()
        showMatchSuggestions(learner, learnerUser, suggestions)
    }

    private fun calculateCompatibility(
        learner: LearnAsker, 
        learnerUser: User, 
        teacher: LearnGiver, 
        teacherUser: User
    ): Int {
        var score = 0

        // Location match (same city)
        if (learnerUser.city == teacherUser.city) {
            score += 40
        }

        // Subject match
        val learnerSubjects = learner.subjects.split(",").map { it.trim().lowercase() }
        val teacherSubjects = teacher.subjectsCanTeach.split(",").map { it.trim().lowercase() }
        val commonSubjects = learnerSubjects.intersect(teacherSubjects.toSet())
        score += commonSubjects.size * 20

        // Schedule compatibility (simplified)
        if (hasScheduleOverlap(learner.preferredSchedule, teacher.availableSchedule)) {
            score += 30
        }

        // Teacher availability
        val currentStudents = teacher.currentStudentIds.split(",").filter { it.isNotBlank() }.size
        if (currentStudents < teacher.maxStudents) {
            score += 10
        } else {
            score = 0 // Teacher is full
        }

        return score
    }

    private fun hasScheduleOverlap(learnerSchedule: String, teacherSchedule: String): Boolean {
        val learnerDays = extractDaysFromSchedule(learnerSchedule)
        val teacherDays = extractDaysFromSchedule(teacherSchedule)
        return learnerDays.intersect(teacherDays.toSet()).isNotEmpty()
    }

    private fun extractDaysFromSchedule(schedule: String): List<String> {
        val days = listOf("ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת")
        return days.filter { schedule.contains(it) }
    }

    private fun showMatchSuggestions(
        learner: LearnAsker, 
        learnerUser: User, 
        suggestions: List<Triple<LearnGiver, User, Int>>
    ) {
        if (suggestions.isEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("אין התאמות")
                .setMessage("לא נמצאו מורים מתאימים עבור ${learnerUser.name}")
                .setPositiveButton("אישור", null)
                .show()
            return
        }

        val suggestionTexts = suggestions.take(3).map { (teacher, teacherUser, score) ->
            "${teacherUser.name} - ${teacherUser.city} (התאמה: ${score}%)"
        }.toTypedArray()

        AlertDialog.Builder(this)
            .setTitle("הצעות התאמה עבור ${learnerUser.name}")
            .setItems(suggestionTexts) { _, which ->
                val selectedSuggestion = suggestions[which]
                confirmMatch(learner, learnerUser, selectedSuggestion.first, selectedSuggestion.second)
            }
            .setNegativeButton("ביטול", null)
            .show()
    }

    private fun confirmMatch(learner: LearnAsker, learnerUser: User, teacher: LearnGiver, teacherUser: User) {
        val message = """
            האם לבצע שיבוץ?

            לומד: ${learnerUser.name} (${learnerUser.city})
            מורה: ${teacherUser.name} (${teacherUser.city})

            מקצוע: ${learner.subjects.split(",").first().trim()}
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("אישור שיבוץ")
            .setMessage(message)
            .setPositiveButton("אישור") { _, _ ->
                performMatch(learner, teacher)
            }
            .setNegativeButton("ביטול", null)
            .show()
    }

    private fun performMatch(learner: LearnAsker, teacher: LearnGiver) {
        AlertDialog.Builder(this)
            .setTitle("שיבוץ הושלם")
            .setMessage("השיבוץ בוצע בהצלחה! (דמו)")
            .setPositiveButton("אישור", null)
            .show()
    }

    private fun showTeacherStudents(teacher: LearnGiver) {
        AlertDialog.Builder(this)
            .setTitle("תלמידי המורה")
            .setMessage("אין תלמידים רשומים למורה זה (דמו)")
            .setPositiveButton("אישור", null)
            .show()
    }

    private fun suggestMatches() {
        AlertDialog.Builder(this)
            .setTitle("הצעות התאמה")
            .setMessage("הפונקציה תציג הצעות התאמה כלליות בהתבסס על מיקום וזמינות")
            .setPositiveButton("אישור", null)
            .show()
    }

    private fun filterByCity() {
        val cities = arrayOf("ירושלים", "תל אביב", "חיפה", "בני ברק", "פתח תקווה")

        AlertDialog.Builder(this)
            .setTitle("סינון לפי עיר")
            .setItems(cities) { _, which ->
                val selectedCity = cities[which]
                AlertDialog.Builder(this)
                    .setTitle("סינון")
                    .setMessage("מציג משתמשים מ$selectedCity")
                    .setPositiveButton("אישור", null)
                    .show()
            }
            .setNegativeButton("ביטול", null)
            .show()
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
