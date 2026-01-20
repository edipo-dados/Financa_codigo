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
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[9999] p-4 pt-8 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-xs mx-auto shadow-xl my-auto">
            {/* Header compacto */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">
                {editingMember ? 'Editar' : 'Novo Membro'}
              </h3>
              <button
                onClick={resetForm}
                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Form compacto */}
            <div className="p-3">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Maria"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Parentesco
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione</option>
                    {relationships.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cor
                  </label>
                  <div className="grid grid-cols-6 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-6 h-6 rounded-full border ${
                          formData.color === color
                            ? 'border-gray-800 ring-1 ring-gray-400'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões sempre visíveis */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  {editingMember ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}