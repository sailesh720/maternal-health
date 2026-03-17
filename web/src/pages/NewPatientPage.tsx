import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { patientsApi } from '../services/api'
import { PageHeader, Spinner } from '../components/ui'
import toast from 'react-hot-toast'

const VILLAGES = ['Rampur', 'Sitapur', 'Devgarh', 'Chandpur', 'Nandgaon']
const DISTRICTS = ['Varanasi', 'Lucknow', 'Allahabad']
const CONDITIONS = ['hypertension', 'diabetes', 'anaemia', 'gestational diabetes', 'preeclampsia', 'heart disease', 'tuberculosis', 'hiv']

export function NewPatientPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '', age: '', village: 'Rampur', district: 'Varanasi',
    phone: '', pregnancy_week: '', expected_due_date: '',
    medical_conditions: [] as string[], emergency_contact: '',
    assigned_doctor_id: '', device_id: '',
  })

  const mutation = useMutation({
    mutationFn: () => patientsApi.create({
      ...form,
      age: parseInt(form.age),
      pregnancy_week: parseInt(form.pregnancy_week),
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      toast.success(`${form.name} registered successfully`)
      navigate(`/patients/${data.id}`)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Registration failed')
    },
  })

  const set = (field: string, val: unknown) => setForm((f) => ({ ...f, [field]: val }))
  const toggleCondition = (c: string) => {
    set('medical_conditions',
      form.medical_conditions.includes(c)
        ? form.medical_conditions.filter((x) => x !== c)
        : [...form.medical_conditions, c]
    )
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="p-6 space-y-5 animate-fade-up max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 px-3">
          <ArrowLeft size={15} /> Back
        </button>
        <PageHeader title="Register New Patient" subtitle="Add a pregnant woman to the monitoring system" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Info */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Full Name *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required className="input-field" placeholder="e.g. Sunita Devi" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Age *</label>
              <input type="number" value={form.age} onChange={(e) => set('age', e.target.value)} required min="13" max="55" className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Phone *</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} required className="input-field" placeholder="10-digit number" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Emergency Contact *</label>
              <input value={form.emergency_contact} onChange={(e) => set('emergency_contact', e.target.value)} required className="input-field" />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Location</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Village *</label>
              <select value={form.village} onChange={(e) => set('village', e.target.value)} className="input-field">
                {VILLAGES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">District *</label>
              <select value={form.district} onChange={(e) => set('district', e.target.value)} className="input-field">
                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pregnancy */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Pregnancy Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Current Week *</label>
              <input type="number" value={form.pregnancy_week} onChange={(e) => set('pregnancy_week', e.target.value)} required min="1" max="45" className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Expected Due Date *</label>
              <input type="date" value={form.expected_due_date} onChange={(e) => set('expected_due_date', e.target.value)} required className="input-field" />
            </div>
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Medical Conditions</h3>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCondition(c)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  form.medical_conditions.includes(c)
                    ? 'bg-coral-500/15 border-coral-500/30 text-coral-400'
                    : 'bg-navy-900 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Device */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Device Assignment (Optional)</h3>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Wearable Device ID</label>
            <input value={form.device_id} onChange={(e) => set('device_id', e.target.value)} className="input-field" placeholder="e.g. WD-1026" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {mutation.isPending ? <Spinner size={14} /> : <Save size={14} />}
            Register Patient
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  )
}
