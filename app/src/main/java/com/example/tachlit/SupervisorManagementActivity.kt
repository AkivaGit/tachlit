package com.example.tachlit

import android.app.AlertDialog
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.tachlit.data.*
import com.example.tachlit.databinding.ActivitySupervisorManagementBinding

class SupervisorManagementActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySupervisorManagementBinding
    private lateinit var learnersAdapter: LearnersAdapter
    private lateinit var teachersAdapter: TeachersAdapter

    companion object {
        const val EXTRA_VIEW_TYPE = "view_type"
        const val VIEW_ALL_USERS = "all_users"
        const val VIEW_UNMATCHED_LEARNERS = "unmatched_learners"
        const val VIEW_AVAILABLE_TEACHERS = "available_teachers"
        const val VIEW_SUGGESTED_MATCHES = "suggested_matches"
    }

    // Static dummy data
    private val dummyLearners = listOf(
        Pair(
            LearnAsker(1, 1, "גמרא, הלכה", "להעמיק בלימוד התלמוד", "ראשון 19:00-21:00, רביעי 20:00-22:00", "מתחיל", "מעוניין בלימוד רציני"),
            User(1, "יוסי כהן", "yossi@example.com", "050-1234567", "ירושלים", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(2, 2, "תנ״ך, פרשת השבוע", "להבין פשט המקרא", "שלישי 18:00-20:00, חמישי 19:00-21:00", "בינוני", "אוהב ללמוד עם חברותא"),
            User(2, "אברהם לוי", "avraham@example.com", "052-9876543", "תל אביב", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(3, 3, "משנה, הלכות שבת", "ללמוד הלכות מעשיות", "שני 20:00-22:00, שישי 10:00-12:00", "מתקדם", "רוצה להתמחות בהלכה"),
            User(3, "דוד רוזן", "david@example.com", "054-5555555", "חיפה", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(4, 4, "משנה, גמרא", "ללמוד בעיון ובהבנה", "ראשון 18:00-20:00, שלישי 19:00-21:00", "מתחיל", "רוצה להתחיל ללמוד ברצינות"),
            User(4, "משה גרין", "moshe.green@example.com", "050-2345678", "בני ברק", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(5, 5, "תנ״ך, נ״ך", "להכיר את התנ״ך לעומק", "שני 20:00-22:00, חמישי 18:00-20:00", "בינוני", "אוהב לימוד פשט"),
            User(5, "אליעזר שמיר", "eliezer@example.com", "052-3456789", "פתח תקווה", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(6, 6, "הלכה, שולחן ערוך", "ללמוד הלכה למעשה", "רביעי 19:00-21:00, שישי 16:00-18:00", "מתקדם", "מעוניין בהלכות יומיות"),
            User(6, "יצחק ברק", "yitzchak@example.com", "054-4567890", "אשדוד", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(7, 7, "קבלה, זוהר", "להבין עולם הנסתר", "ראשון 21:00-23:00, רביעי 21:00-23:00", "מתחיל", "מתעניין בחכמת הקבלה"),
            User(7, "נתן גולדברג", "natan@example.com", "050-5678901", "רחובות", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(8, 8, "גמרא, תוספות", "ללמוד בעיון עמוק", "שלישי 20:00-22:00, שישי 14:00-16:00", "מתקדם", "רוצה להעמיק בלימוד"),
            User(8, "אהרן סילבר", "aharon@example.com", "052-6789012", "נתניה", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(9, 9, "משנה, ברורה", "ללמוד הלכות תפילה", "שני 19:00-21:00, חמישי 20:00-22:00", "בינוני", "מעוניין בהלכות תפילה"),
            User(9, "שמעון וייס", "shimon@example.com", "054-7890123", "רמת גן", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(10, 10, "תנ״ך, רש״י", "להבין פירוש רש״י", "ראשון 17:00-19:00, רביעי 18:00-20:00", "מתחיל", "רוצה להכיר את רש״י"),
            User(10, "גדעון כהן", "gideon@example.com", "050-8901234", "הרצליה", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(11, 11, "הלכה, רמב״ם", "ללמוד משנה תורה", "שלישי 19:00-21:00, שישי 15:00-17:00", "מתקדם", "מעוניין ברמב״ם"),
            User(11, "אורי פרידמן", "uri@example.com", "052-9012345", "כפר סבא", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(12, 12, "גמרא, ראשונים", "ללמוד עם פירושי הראשונים", "שני 18:00-20:00, חמישי 19:00-21:00", "בינוני", "אוהב לימוד מעמיק"),
            User(12, "בנימין רוזנברג", "binyamin@example.com", "054-0123456", "רעננה", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(13, 13, "תנ״ך, מדרש", "להכיר את המדרשים", "ראשון 20:00-22:00, רביעי 19:00-21:00", "מתחיל", "מתעניין במדרשים"),
            User(13, "יעקב שטיין", "yaakov.stein@example.com", "050-1357924", "גבעתיים", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(14, 14, "משנה, תוספתא", "ללמוד משנה ותוספתא", "שלישי 18:00-20:00, שישי 13:00-15:00", "מתקדם", "רוצה להעמיק במשנה"),
            User(14, "דניאל גולד", "daniel@example.com", "052-2468135", "חולון", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(15, 15, "הלכה, ביאור הלכה", "ללמוד ביאור הלכה", "שני 20:00-22:00, חמישי 18:00-20:00", "בינוני", "מעוניין בביאור הלכה"),
            User(15, "רפאל כץ", "rafael@example.com", "054-3691470", "בת ים", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(16, 16, "גמרא, מהרש״א", "ללמוד עם מהרש״א", "ראשון 19:00-21:00, רביעי 20:00-22:00", "מתקדם", "אוהב לימוד עמוק"),
            User(16, "מיכאל לוי", "michael@example.com", "050-4815926", "לוד", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(17, 17, "תנ״ך, אבן עזרא", "להבין פירוש אבן עזרא", "שלישי 17:00-19:00, שישי 16:00-18:00", "בינוני", "מתעניין באבן עזרא"),
            User(17, "אלכסנדר בן דוד", "alexander@example.com", "052-5927384", "מודיעין", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(18, 18, "קבלה, עץ חיים", "ללמוד ספר עץ חיים", "שני 21:00-23:00, חמישי 21:00-23:00", "מתחיל", "רוצה להתחיל בקבלה"),
            User(18, "יונתן אברמוביץ", "yonatan@example.com", "054-6048271", "ראשון לציון", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(19, 19, "הלכה, ערוך השולחן", "ללמוד ערוך השולחן", "ראשון 18:00-20:00, רביעי 17:00-19:00", "מתקדם", "מעוניין בערוך השולחן"),
            User(19, "עמנואל שוורץ", "emanuel@example.com", "050-7159483", "הוד השרון", UserType.LEARN_ASKER.name)
        ),
        Pair(
            LearnAsker(20, 20, "גמרא, רי״ף", "ללמוד עם פירוש הרי״ף", "שלישי 20:00-22:00, שישי 14:00-16:00", "בינוני", "אוהב לימוד הלכתי"),
            User(20, "אסף גרינברג", "asaf@example.com", "052-8260594", "קריית אונו", UserType.LEARN_ASKER.name)
        )
    )

    private val dummyTeachers = listOf(
        Pair(
            LearnGiver(1, 21, "גמרא, הלכה, פילוסופיה יהודית", "15 שנות הוראה בישיבה", "ראשון-חמישי 18:00-23:00", 5, "לימוד מעמיק עם דיון", "מתמחה בגמרא"),
            User(21, "יעקב גולד", "yaakov@example.com", "053-1111111", "ירושלים", UserType.LEARN_GIVER.name)
        ),
        Pair(
            LearnGiver(2, 22, "תנ״ך, פרשת השבוע, מדרש", "10 שנות הוראה", "ראשון-רביעי 17:00-22:00", 3, "לימוד קל וחווייתי", "אוהב ללמד גברים"),
            User(22, "משה אברהם", "moshe@example.com", "050-2222222", "תל אביב", UserType.LEARN_GIVER.name)
        ),
        Pair(
            LearnGiver(3, 23, "משנה, הלכה מעשית, קבלה", "20 שנות הוראה", "כל השבוע 19:00-22:00", 4, "לימוד מסורתי ומעמיק", "מתמחה בהלכה למעשה"),
            User(23, "שמואל כהן", "shmuel@example.com", "052-3333333", "חיפה", UserType.LEARN_GIVER.name)
        ),
        Pair(
            LearnGiver(4, 24, "גמרא, תוספות, ראשונים", "12 שנות הוראה", "שני-חמישי 19:00-22:00", 3, "לימוד עיוני מתקדם", "מתמחה בתוספות"),
            User(24, "אליהו רוזן", "eliyahu@example.com", "054-4444444", "בני ברק", UserType.LEARN_GIVER.name)
        ),
        Pair(
            LearnGiver(5, 25, "תנ״ך, רש״י, רמב״ן", "8 שנות הוראה", "ראשון-רביעי 18:00-21:00", 4, "לימוד פשט ודרש", "אוהב ללמד תנ״ך"),
            User(25, "חיים לוי", "chaim@example.com", "050-5555555", "פתח תקווה", UserType.LEARN_GIVER.name)
        ),
        Pair(
            LearnGiver(6, 26, "הלכה, שולחן ערוך, משנה ברורה", "18 שנות הוראה", "ראשון-שישי 17:00-21:00", 6, "הלכה למעשה", "מתמחה בהלכות יומיות"),
            User(26, "דוד שטרן", "david.stern@example.com", "052-6666666", "אשדוד", UserType.LEARN_GIVER.name)
        ),
        Pair(
            LearnGiver(7, 27, "קבלה, זוהר, עץ חיים", "25 שנות הוראה", "שלישי-שישי 20:00-23:00", 2, "לימוד עמוק בקבלה", "מקובל מנוסה"),
            User(27, "אברהם גרינברג", "avraham.green@example.com", "054-7777777", "צפת", UserType.LEARN_GIVER.name)
        ),
        Pair(
            LearnGiver(8, 28, "משנה, גמרא, רמב״ם", "14 שנות הוראה", "ראשון-חמישי 19:00-22:00", 4, "לימוד שיטתי", "מתמחה ברמב״ם"),
            User(28, "יוסף כהן", "yosef@example.com", "050-8888888", "נתניה", UserType.LEARN_GIVER.name)
        ),
        Pair(
            LearnGiver(9, 29, "תנ״ך, נביאים, כתובים", "7 שנות הוראה", "שני-חמישי 18:00-21:00", 3, "לימוד מקרא", "מתמחה בנ״ך"),
            User(29, "מנחם גולדשטיין", "menachem@example.com", "052-9999999", "רמת גן", UserType.LEARN_GIVER.name)
        ),
        Pair(
            LearnGiver(10, 30, "גמרא, הלכה, אגדה", "16 שנות הוראה", "ראשון-רביעי 20:00-23:00", 5, "לימוד מגוון", "אוהב ללמד הלכה ואגדה"),
            User(30, "אריה פרידמן", "aryeh@example.com", "054-0000000", "מודיעין", UserType.LEARN_GIVER.name)
        )
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_supervisor_management)

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
        when (viewType) {
            VIEW_ALL_USERS -> {
                // Show both learners and teachers (matched and unmatched)
                println("[DEBUG_LOG] Loading all users - dummyLearners size: ${dummyLearners.size}")
                learnersAdapter.submitList(dummyLearners)
                teachersAdapter.submitList(dummyTeachers)
                binding.tvLearnersCount.text = dummyLearners.size.toString()
                binding.tvTeachersCount.text = dummyTeachers.size.toString()
                val matchedCount = dummyLearners.count { it.first.isMatched }
                binding.tvPairingsCount.text = matchedCount.toString()

                // Update section titles
                updateSectionTitles("כל הלומדים", "כל המורים")
                forceRecyclerViewMeasurement()
            }
            VIEW_UNMATCHED_LEARNERS -> {
                // Show only unmatched learners
                val unmatchedLearners = dummyLearners.filter { !it.first.isMatched }
                learnersAdapter.submitList(unmatchedLearners)
                teachersAdapter.submitList(emptyList()) // Hide teachers section
                binding.tvLearnersCount.text = unmatchedLearners.size.toString()
                binding.tvTeachersCount.text = "0"
                binding.tvPairingsCount.text = "0"

                // Update section titles
                updateSectionTitles("לומדים שלא שובצו", "")
                forceRecyclerViewMeasurement()
            }
            VIEW_AVAILABLE_TEACHERS -> {
                // Show only available teachers
                val availableTeachers = dummyTeachers.filter { teacher ->
                    val currentStudents = teacher.first.currentStudentIds.split(",").filter { it.isNotBlank() }.size
                    currentStudents < teacher.first.maxStudents
                }
                learnersAdapter.submitList(emptyList()) // Hide learners section
                teachersAdapter.submitList(availableTeachers)
                binding.tvLearnersCount.text = "0"
                binding.tvTeachersCount.text = availableTeachers.size.toString()
                binding.tvPairingsCount.text = "0"

                // Update section titles
                updateSectionTitles("", "מורים זמינים")
                forceRecyclerViewMeasurement()
            }
            VIEW_SUGGESTED_MATCHES -> {
                // Show only unmatched learners and available teachers for matching
                val unmatchedLearners = dummyLearners.filter { !it.first.isMatched }
                val availableTeachers = dummyTeachers.filter { teacher ->
                    val currentStudents = teacher.first.currentStudentIds.split(",").filter { it.isNotBlank() }.size
                    currentStudents < teacher.first.maxStudents
                }
                learnersAdapter.submitList(unmatchedLearners)
                teachersAdapter.submitList(availableTeachers)
                binding.tvLearnersCount.text = unmatchedLearners.size.toString()
                binding.tvTeachersCount.text = availableTeachers.size.toString()
                binding.tvPairingsCount.text = "0"

                // Update section titles
                updateSectionTitles("לומדים לשיבוץ", "מורים זמינים לשיבוץ")
                forceRecyclerViewMeasurement()
            }
            else -> {
                // Default: show all data
                learnersAdapter.submitList(dummyLearners)
                teachersAdapter.submitList(dummyTeachers)
                binding.tvLearnersCount.text = dummyLearners.size.toString()
                binding.tvTeachersCount.text = dummyTeachers.size.toString()
                val matchedCount = dummyLearners.count { it.first.isMatched }
                binding.tvPairingsCount.text = matchedCount.toString()

                // Update section titles
                updateSectionTitles("כל הלומדים", "כל המורים")
                forceRecyclerViewMeasurement()
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
        val suggestions = dummyTeachers.mapNotNull { (teacher, teacherUser) ->
            val compatibility = calculateCompatibility(learner, learnerUser, teacher, teacherUser)
            if (compatibility > 0) {
                Triple(teacher, teacherUser, compatibility)
            } else null
        }.sortedByDescending { it.third }

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
