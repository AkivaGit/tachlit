package com.example.tachlit

import android.app.AlertDialog
import android.os.Bundle
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.tachlit.data.*
import com.example.tachlit.databinding.ActivitySupervisorManagementBinding
import com.example.tachlit.repository.TachlitRepository
import kotlinx.coroutines.launch

class SupervisorManagementActivity : BaseActivity() {

    private lateinit var binding: ActivitySupervisorManagementBinding
    private lateinit var learnersAdapter: LearnersAdapter
    private lateinit var teachersAdapter: TeachersAdapter
    private lateinit var officeVolunteersAdapter: GenericUsersAdapter
    private lateinit var foodVolunteersAdapter: GenericUsersAdapter
    private lateinit var supervisorsAdapter: GenericUsersAdapter
    private lateinit var groupCoordinatorsAdapter: GenericUsersAdapter
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

        // Get supervisor token from intent and set it in repository
        val supervisorToken = intent.getStringExtra("supervisor_token")
        if (supervisorToken != null) {
            repository.setSupervisorToken(supervisorToken)
            println("[DEBUG_LOG] SupervisorManagementActivity: Supervisor token set successfully")
        } else {
            println("[DEBUG_LOG] SupervisorManagementActivity: No supervisor token received from intent")
        }

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
        learnersAdapter = LearnersAdapter(
            onLearnerClick = { learner, user ->
                onLearnerSelected(learner, user)
            },
            onLearnerLongClick = { learner, user ->
                showDeleteUserConfirmation(user)
            }
        )

        teachersAdapter = TeachersAdapter(
            onTeacherClick = { teacher, user ->
                onTeacherSelected(teacher, user)
            },
            onTeacherLongClick = { teacher, user ->
                showDeleteUserConfirmation(user)
            }
        )

        officeVolunteersAdapter = GenericUsersAdapter(
            onUserClick = { user -> showGenericUserDetails(user) },
            onUserLongClick = { user -> showDeleteUserConfirmation(user) }
        )

        foodVolunteersAdapter = GenericUsersAdapter(
            onUserClick = { user -> showGenericUserDetails(user) },
            onUserLongClick = { user -> showDeleteUserConfirmation(user) }
        )

        supervisorsAdapter = GenericUsersAdapter(
            onUserClick = { user -> showGenericUserDetails(user) },
            onUserLongClick = { user -> showDeleteUserConfirmation(user) }
        )

        groupCoordinatorsAdapter = GenericUsersAdapter(
            onUserClick = { user -> showGenericUserDetails(user) },
            onUserLongClick = { user -> showDeleteUserConfirmation(user) }
        )

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

        binding.recyclerViewOfficeVolunteers.apply {
            layoutManager = LinearLayoutManager(this@SupervisorManagementActivity)
            adapter = officeVolunteersAdapter
            setHasFixedSize(false)
        }

        binding.recyclerViewFoodVolunteers.apply {
            layoutManager = LinearLayoutManager(this@SupervisorManagementActivity)
            adapter = foodVolunteersAdapter
            setHasFixedSize(false)
        }

        binding.recyclerViewSupervisors.apply {
            layoutManager = LinearLayoutManager(this@SupervisorManagementActivity)
            adapter = supervisorsAdapter
            setHasFixedSize(false)
        }

        binding.recyclerViewGroupCoordinators.apply {
            layoutManager = LinearLayoutManager(this@SupervisorManagementActivity)
            adapter = groupCoordinatorsAdapter
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
        binding.recyclerViewOfficeVolunteers.post {
            binding.recyclerViewOfficeVolunteers.requestLayout()
        }
        binding.recyclerViewFoodVolunteers.post {
            binding.recyclerViewFoodVolunteers.requestLayout()
        }
        binding.recyclerViewSupervisors.post {
            binding.recyclerViewSupervisors.requestLayout()
        }
        binding.recyclerViewGroupCoordinators.post {
            binding.recyclerViewGroupCoordinators.requestLayout()
        }
    }

    private fun loadDataBasedOnViewType(viewType: String) {
        lifecycleScope.launch {
            showLoading()
            when (viewType) {
                VIEW_ALL_USERS -> {
                    // Load real data from repository
                    println("[DEBUG_LOG] Loading all users from repository")
                    repository.getAllUsers().collect { users ->
                        hideLoading()
                        println("[DEBUG_LOG] Received ${users.size} users from repository")
                        users.forEach { user ->
                            println("[DEBUG_LOG] User: id=${user.id}, name=${user.name}, userType='${user.userType}'")
                        }

                        // Separate users by type
                        println("[DEBUG_LOG] About to filter users. Total users: ${users.size}")
                        println("[DEBUG_LOG] Expected userTypes: LEARN_ASKER='${UserType.LEARN_ASKER.name}', LEARN_GIVER='${UserType.LEARN_GIVER.name}'")

                        // Debug: Print all user types we received
                        users.forEach { user ->
                            println("[DEBUG_LOG] User ${user.name} has userType: '${user.userType}' (length: ${user.userType.length})")
                        }

                        val learners = users.filter { 
                            val matches = it.userType == UserType.LEARN_ASKER.name
                            println("[DEBUG_LOG] User ${it.name} userType '${it.userType}' matches LEARN_ASKER: $matches")
                            matches
                        }
                        val teachers = users.filter { 
                            val matches = it.userType == UserType.LEARN_GIVER.name
                            println("[DEBUG_LOG] User ${it.name} userType '${it.userType}' matches LEARN_GIVER: $matches")
                            matches
                        }
                        val officeVolunteers = users.filter { it.userType == UserType.OFFICE_VOLUNTEER.name }
                        val foodVolunteers = users.filter { it.userType == UserType.FOOD_VOLUNTEER.name }
                        val supervisors = users.filter { it.userType == UserType.SUPERVISOR.name }
                        val groupCoordinators = users.filter { it.userType == UserType.GROUP_COORDINATOR.name }

                        println("[DEBUG_LOG] Filtered: learners=${learners.size}, teachers=${teachers.size}, officeVol=${officeVolunteers.size}, foodVol=${foodVolunteers.size}, supervisors=${supervisors.size}, groupCoord=${groupCoordinators.size}")

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
                        officeVolunteersAdapter.submitList(officeVolunteers)
                        foodVolunteersAdapter.submitList(foodVolunteers)
                        supervisorsAdapter.submitList(supervisors)
                        groupCoordinatorsAdapter.submitList(groupCoordinators)
                        binding.tvLearnersCount.text = learnerPairs.size.toString()
                        binding.tvTeachersCount.text = teacherPairs.size.toString()
                        binding.tvPairingsCount.text = "0"

                        updateSectionTitles("כל הלומדים", "כל המורים")
                        updateAllSectionVisibility(officeVolunteers.isNotEmpty(), foodVolunteers.isNotEmpty(), supervisors.isNotEmpty(), groupCoordinators.isNotEmpty())
                        forceRecyclerViewMeasurement()
                    }
                }
                VIEW_UNMATCHED_LEARNERS -> {
                    repository.getAllUsers().collect { users ->
                        hideLoading()
                        println("[DEBUG_LOG] VIEW_UNMATCHED_LEARNERS: Received ${users.size} users from repository")
                        users.forEach { user ->
                            println("[DEBUG_LOG] UNMATCHED: User ${user.name} has userType: '${user.userType}'")
                        }
                        val learners = users.filter { 
                            val matches = it.userType == UserType.LEARN_ASKER.name
                            println("[DEBUG_LOG] UNMATCHED: User ${it.name} userType '${it.userType}' matches LEARN_ASKER: $matches")
                            matches
                        }
                        val learnerPairs = learners.map { user ->
                            Pair(
                                LearnAsker(userId = user.id, subjects = "", learningGoals = "", preferredSchedule = "", experienceLevel = "Beginner"),
                                user
                            )
                        }

                        learnersAdapter.submitList(learnerPairs)
                        teachersAdapter.submitList(emptyList())
                        officeVolunteersAdapter.submitList(emptyList())
                        foodVolunteersAdapter.submitList(emptyList())
                        supervisorsAdapter.submitList(emptyList())
                        groupCoordinatorsAdapter.submitList(emptyList())
                        binding.tvLearnersCount.text = learnerPairs.size.toString()
                        binding.tvTeachersCount.text = "0"
                        binding.tvPairingsCount.text = "0"

                        updateSectionTitles("לומדים שלא שובצו", "")
                        updateAllSectionVisibility(false, false, false, false)
                        forceRecyclerViewMeasurement()
                    }
                }
                VIEW_AVAILABLE_TEACHERS -> {
                    repository.getAllUsers().collect { users ->
                        hideLoading()
                        val teachers = users.filter { it.userType == UserType.LEARN_GIVER.name }
                        val teacherPairs = teachers.map { user ->
                            Pair(
                                LearnGiver(userId = user.id, subjectsCanTeach = "", teachingExperience = "", availableSchedule = "", teachingStyle = ""),
                                user
                            )
                        }

                        learnersAdapter.submitList(emptyList())
                        teachersAdapter.submitList(teacherPairs)
                        officeVolunteersAdapter.submitList(emptyList())
                        foodVolunteersAdapter.submitList(emptyList())
                        supervisorsAdapter.submitList(emptyList())
                        groupCoordinatorsAdapter.submitList(emptyList())
                        binding.tvLearnersCount.text = "0"
                        binding.tvTeachersCount.text = teacherPairs.size.toString()
                        binding.tvPairingsCount.text = "0"

                        updateSectionTitles("", "מורים זמינים")
                        updateAllSectionVisibility(false, false, false, false)
                        forceRecyclerViewMeasurement()
                    }
                }
                VIEW_SUGGESTED_MATCHES -> {
                    repository.getAllUsers().collect { users ->
                        hideLoading()
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
                        officeVolunteersAdapter.submitList(emptyList())
                        foodVolunteersAdapter.submitList(emptyList())
                        supervisorsAdapter.submitList(emptyList())
                        groupCoordinatorsAdapter.submitList(emptyList())
                        binding.tvLearnersCount.text = learnerPairs.size.toString()
                        binding.tvTeachersCount.text = teacherPairs.size.toString()
                        binding.tvPairingsCount.text = "0"

                        updateSectionTitles("לומדים לשיבוץ", "מורים זמינים לשיבוץ")
                        updateAllSectionVisibility(false, false, false, false)
                        forceRecyclerViewMeasurement()
                    }
                }
                else -> {
                    repository.getAllUsers().collect { users ->
                        hideLoading()
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
                        officeVolunteersAdapter.submitList(emptyList())
                        foodVolunteersAdapter.submitList(emptyList())
                        supervisorsAdapter.submitList(emptyList())
                        groupCoordinatorsAdapter.submitList(emptyList())
                        binding.tvLearnersCount.text = learnerPairs.size.toString()
                        binding.tvTeachersCount.text = teacherPairs.size.toString()
                        binding.tvPairingsCount.text = "0"

                        updateSectionTitles("כל הלומדים", "כל המורים")
                        updateAllSectionVisibility(false, false, false, false)
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
            binding.cardViewLearners.visibility = android.view.View.VISIBLE
        } else {
            binding.cardViewLearners.visibility = android.view.View.GONE
        }

        // Update teachers section
        if (teachersTitle.isNotEmpty()) {
            binding.tvTeachersTitle.text = teachersTitle
            binding.cardViewTeachers.visibility = android.view.View.VISIBLE
        } else {
            binding.cardViewTeachers.visibility = android.view.View.GONE
        }
    }

    private fun updateAllSectionVisibility(
        showOfficeVolunteers: Boolean,
        showFoodVolunteers: Boolean,
        showSupervisors: Boolean,
        showGroupCoordinators: Boolean
    ) {
        binding.cardViewOfficeVolunteers.visibility =
            if (showOfficeVolunteers) android.view.View.VISIBLE else android.view.View.GONE
        binding.cardViewFoodVolunteers.visibility =
            if (showFoodVolunteers) android.view.View.VISIBLE else android.view.View.GONE
        binding.cardViewSupervisors.visibility =
            if (showSupervisors) android.view.View.VISIBLE else android.view.View.GONE
        binding.cardViewGroupCoordinators.visibility =
            if (showGroupCoordinators) android.view.View.VISIBLE else android.view.View.GONE
    }

    private fun showGenericUserDetails(user: User) {
        val message = """
            שם: ${user.name} ${user.familyName}
            אימייל: ${user.email}
            עיר: ${user.city}
            טלפון: ${user.phone}
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("פרטי המשתמש")
            .setMessage(message)
            .setNegativeButton("סגור", null)
            .show()
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

    private fun showDeleteUserConfirmation(user: User) {
        val dialog = AlertDialog.Builder(this)
            .setTitle("מחיקת משתמש")
            .setMessage("האם אתה רוצה למחוק משתמש זה?\n\nשם: ${user.name} ${user.familyName}\nאימייל: ${user.email}")
            .setPositiveButton("כן") { _, _ ->
                deleteUser(user)
            }
            .setNegativeButton("ביטול", null)
            .create()

        dialog.show()
    }

    private fun deleteUser(user: User) {
        lifecycleScope.launch {
            showLoading()
            try {
                println("[DEBUG_LOG] Attempting to delete user: ${user.name} (id=${user.id})")
                val result = repository.deleteUser(user.id)
                hideLoading()

                if (result.isSuccess) {
                    println("[DEBUG_LOG] User deleted successfully")
                    // Set result to indicate that data has changed
                    setResult(RESULT_OK)

                    // Show success message
                    AlertDialog.Builder(this@SupervisorManagementActivity)
                        .setTitle("הצלחה")
                        .setMessage("המשתמש נמחק בהצלחה")
                        .setPositiveButton("אישור", null)
                        .show()

                    // Refresh the current view
                    val currentViewType = intent.getStringExtra(EXTRA_VIEW_TYPE) ?: VIEW_ALL_USERS
                    loadDataBasedOnViewType(currentViewType)
                } else {
                    println("[DEBUG_LOG] Failed to delete user: ${result.exceptionOrNull()?.message}")
                    // Show error message
                    AlertDialog.Builder(this@SupervisorManagementActivity)
                        .setTitle("שגיאה")
                        .setMessage("שגיאה במחיקת המשתמש: ${result.exceptionOrNull()?.message}")
                        .setPositiveButton("אישור", null)
                        .show()
                }
            } catch (e: Exception) {
                hideLoading()
                println("[DEBUG_LOG] Exception during user deletion: ${e.message}")
                // Show error message
                AlertDialog.Builder(this@SupervisorManagementActivity)
                    .setTitle("שגיאה")
                    .setMessage("שגיאה במחיקת המשתמש: ${e.message}")
                    .setPositiveButton("אישור", null)
                    .show()
            }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
