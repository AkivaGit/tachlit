package com.example.tachlit

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.tachlit.data.User
import com.example.tachlit.databinding.ItemUserBinding

class GenericUsersAdapter(
    private val onUserClick: (User) -> Unit,
    private val onUserLongClick: (User) -> Unit
) : ListAdapter<User, GenericUsersAdapter.UserViewHolder>(UserDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
        val binding = ItemUserBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return UserViewHolder(binding)
    }

    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        val item = getItem(position)
        holder.bind(item, onUserClick, onUserLongClick)
    }

    class UserViewHolder(private val binding: ItemUserBinding) : RecyclerView.ViewHolder(binding.root) {

        fun bind(user: User, onUserClick: (User) -> Unit, onUserLongClick: (User) -> Unit) {
            binding.tvUserName.text = user.name
            binding.tvUserCity.text = user.city
            binding.tvUserEmail.text = "אימייל: ${user.email}"
            binding.tvUserPhone.text = "טלפון: ${user.phone}"

            binding.root.setOnClickListener {
                onUserClick(user)
            }

            binding.root.setOnLongClickListener {
                onUserLongClick(user)
                true
            }
        }
    }

    private class UserDiffCallback : DiffUtil.ItemCallback<User>() {
        override fun areItemsTheSame(oldItem: User, newItem: User): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: User, newItem: User): Boolean {
            return oldItem == newItem
        }
    }
}
