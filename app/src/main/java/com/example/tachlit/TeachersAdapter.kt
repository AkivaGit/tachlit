package com.example.tachlit

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.tachlit.data.LearnGiver
import com.example.tachlit.data.User
import com.example.tachlit.databinding.ItemTeacherBinding

class TeachersAdapter(
    private val onTeacherClick: (LearnGiver, User) -> Unit,
    private val onTeacherLongClick: (LearnGiver, User) -> Unit
) : ListAdapter<Pair<LearnGiver, User>, TeachersAdapter.TeacherViewHolder>(TeacherDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TeacherViewHolder {
        val binding = ItemTeacherBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return TeacherViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TeacherViewHolder, position: Int) {
        val item = getItem(position)
        holder.bind(item.first, item.second, onTeacherClick, onTeacherLongClick)
    }

    class TeacherViewHolder(private val binding: ItemTeacherBinding) : RecyclerView.ViewHolder(binding.root) {

        fun bind(teacher: LearnGiver, user: User, onTeacherClick: (LearnGiver, User) -> Unit, onTeacherLongClick: (LearnGiver, User) -> Unit) {
            binding.tvTeacherName.text = user.name
            binding.tvTeacherCity.text = user.city
            binding.tvTeacherSubjects.text = "מקצועות: ${teacher.subjectsCanTeach}"
            binding.tvTeacherSchedule.text = "זמנים: ${teacher.availableSchedule}"
            binding.tvTeacherExperience.text = teacher.teachingExperience

            // Calculate current students count
            val currentStudents = teacher.currentStudentIds.split(",").filter { it.isNotBlank() }.size
            binding.tvTeacherCapacity.text = "$currentStudents/${teacher.maxStudents} תלמידים"

            binding.root.setOnClickListener {
                onTeacherClick(teacher, user)
            }

            binding.root.setOnLongClickListener {
                onTeacherLongClick(teacher, user)
                true
            }
        }
    }

    private class TeacherDiffCallback : DiffUtil.ItemCallback<Pair<LearnGiver, User>>() {
        override fun areItemsTheSame(oldItem: Pair<LearnGiver, User>, newItem: Pair<LearnGiver, User>): Boolean {
            return oldItem.first.id == newItem.first.id
        }

        override fun areContentsTheSame(oldItem: Pair<LearnGiver, User>, newItem: Pair<LearnGiver, User>): Boolean {
            return oldItem == newItem
        }
    }
}
