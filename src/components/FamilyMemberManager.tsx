'use client'

import { useState } from 'react'
import { useFamilyMembers } from '@/hooks/useFamilyMembers'
import { FamilyMember } from '@/types'

interface Props {
  userId: string
}

export default function FamilyMemberManager({ userId }: Props) {
  const { members, loading, addMember, updateMember, deleteMember } = useFamilyMembers(userId)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    color: '#3b82f6'
  })

  const relationships = [
    'Cônjuge',
    'Filho(a)',
    'Pai',
    'Mãe',
    'Irmão(ã)',
    'Avô(ó)',
    'Tio(a)',
    'Primo(a)',
    'Outro'
  ]

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#6366f1', '#14b8a6', '#eab308'
  ]

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      relationship: '',
      color: '#3b82f6'
    })
    setEditingMember(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const memberData = {
      user_id: userId,
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      relationship: formData.relationship || null,
      color: formData.color,
      is_active: true
    }

    if (editingMember) {
      await updateMember(editingMember.id, memberData)
    } else {
      await addMember(memberData)
    }

    resetForm()
  }

  const handleEdit = (member: FamilyMember) => {
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      relationship: member.relationship || '',
      color: member.color
    })
    setEditingMember(member)
    setShowForm(true)
  }

  const handleDelete = async (member: FamilyMember) => {
    if (confirm(`Tem certeza que deseja remover ${member.name} da família?`)) {
      await deleteMember(member.id)
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">👨‍👩‍👧‍👦</span>
          <h2 className="text-xl font-semibold text-apple-gray-700">Membros da Família</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 rounded-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍👩‍👧‍👦</span>
          <h2 className="text-xl font-semibold text-apple-gray-700">Membros da Família</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Adicionar Membro
        </button>
      </div>

      {/* Lista de Membros */}
      {members.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-700 mb-2">
            Nenhum membro cadastrado
          </h3>
          <p className="text-apple-gray-400 text-sm mb-4">
            Adicione membros da família para organizar melhor suas finanças
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            + Adicionar Primeiro Membro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-4 bg-white rounded-xl border border-apple-gray-200 hover:shadow-apple transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-apple-gray-700">{member.name}</h3>
                  {member.relationship && (
                    <p className="text-sm text-apple-gray-500">{member.relationship}</p>
                  )}
                </div>
              </div>

              {(member.email || member.phone) && (
                <div className="space-y-1 mb-3">
                  {member.email && (
                    <p className="text-xs text-apple-gray-500">📧 {member.email}</p>
                  )}
                  {member.phone && (
                    <p className="text-xs text-apple-gray-500">📱 {member.phone}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="flex-1 px-3 py-2 bg-apple-blue text-white rounded-lg hover:bg-apple-blue/90 transition-colors text-sm"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(member)}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  🗑️ Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-apple-gray-200">
              <h3 className="text-xl font-semibold text-apple-gray-700">
                {editingMember ? 'Editar Membro' : 'Adicionar Membro'}
              </h3>
              <button
                onClick={resetForm}
                className="w-8 h-8 rounded-full bg-apple-gray-100 flex items-center justify-center hover:bg-apple-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-apple-gray-200 rounded-xl focus:ring-2 focus:ring-apple-blue focus:border-apple-blue outline-none transition-colors"
                    placeholder="Ex: Maria Silva"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                    Parentesco
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-4 py-3 border border-apple-gray-200 rounded-xl focus:ring-2 focus:ring-apple-blue focus:border-apple-blue outline-none transition-colors"
                  >
                    <option value="">Selecione o parentesco</option>
                    {relationships.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-apple-gray-200 rounded-xl focus:ring-2 focus:ring-apple-blue focus:border-apple-blue outline-none transition-colors"
                    placeholder="maria@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-apple-gray-200 rounded-xl focus:ring-2 focus:ring-apple-blue focus:border-apple-blue outline-none transition-colors"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-apple-gray-600 mb-2">
                    Cor de Identificação
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color
                            ? 'border-apple-gray-400 scale-110'
                            : 'border-apple-gray-200 hover:border-apple-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer com botões */}
            <div className="p-6 border-t border-apple-gray-200 bg-apple-gray-50">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 bg-white border border-apple-gray-200 text-apple-gray-700 rounded-xl font-medium hover:bg-apple-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-apple-blue text-white rounded-xl font-medium hover:bg-apple-blue/90 transition-colors"
                >
                  {editingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}