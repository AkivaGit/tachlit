package com.example.tachlit

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.tachlit.data.LearnAsker
import com.example.tachlit.data.User
import com.example.tachlit.databinding.ItemLearnerBinding

class LearnersAdapter(
    private val onLearnerClick: (LearnAsker, User) -> Unit,
    private val onLearnerLongClick: (LearnAsker, User) -> Unit
) : ListAdapter<Pair<LearnAsker, User>, LearnersAdapter.LearnerViewHolder>(LearnerDiffCallback()) {

    override fun submitList(list: List<Pair<LearnAsker, User>>?) {
        println("[DEBUG_LOG] LearnersAdapter submitList called with ${list?.size ?: 0} items")
        super.submitList(list)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LearnerViewHolder {
        val binding = ItemLearnerBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return LearnerViewHolder(binding)
    }

    override fun onBindViewHolder(holder: LearnerViewHolder, position: Int) {
        val item = getItem(position)
        println("[DEBUG_LOG] LearnersAdapter onBindViewHolder called for position $position, total items: ${itemCount}")
        holder.bind(item.first, item.second, onLearnerClick, onLearnerLongClick)
    }

    class LearnerViewHolder(private val binding: ItemLearnerBinding) : RecyclerView.ViewHolder(binding.root) {

        fun bind(learner: LearnAsker, user: User, onLearnerClick: (LearnAsker, User) -> Unit, onLearnerLongClick: (LearnAsker, User) -> Unit) {
            binding.tvLearnerName.text = user.name
            binding.tvLearnerCity.text = user.city
            binding.tvLearnerSubjects.text = "מקצועות: ${learner.subjects}"
            binding.tvLearnerSchedule.text = "זמנים: ${learner.preferredSchedule}"
            binding.tvLearnerLevel.text = learner.experienceLevel

            binding.root.setOnClickListener {
                onLearnerClick(learner, user)
            }

            binding.root.setOnLongClickListener {
                onLearnerLongClick(learner, user)
                true
            }
        }
    }

    private class LearnerDiffCallback : DiffUtil.ItemCallback<Pair<LearnAsker, User>>() {
        override fun areItemsTheSame(oldItem: Pair<LearnAsker, User>, newItem: Pair<LearnAsker, User>): Boolean {
            return oldItem.first.id == newItem.first.id
        }

        override fun areContentsTheSame(oldItem: Pair<LearnAsker, User>, newItem: Pair<LearnAsker, User>): Boolean {
            return oldItem == newItem
        }
    }
}
