import { useState, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Upload, Play, Square, RefreshCw, Database, Zap } from 'lucide-react'
import { simulationApi, datasetApi } from '../services/api'
import { PageHeader, Spinner } from '../components/ui'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export function DatasetPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadResult, setUploadResult] = useState<{ message: string; total: number } | null>(null)
  const [riskResult, setRiskResult] = useState<string | null>(null)

  const { data: simStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['sim-status'],
    queryFn: simulationApi.status,
    refetchInterval: 5000,
  })

  const startSim = useMutation({
    mutationFn: simulationApi.start,
    onSuccess: () => { toast.success('Simulation started'); refetchStatus() },
    onError: () => toast.error('Failed to start simulation'),
  })

  const stopSim = useMutation({
    mutationFn: simulationApi.stop,
    onSuccess: () => { toast.success('Simulation stopped'); refetchStatus() },
    onError: () => toast.error('Failed to stop simulation'),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => datasetApi.upload(file),
    onSuccess: (data) => {
      setUploadResult(data)
      toast.success(data.message)
    },
    onError: () => toast.error('Upload failed'),
  })

  const riskMutation = useMutation({
    mutationFn: datasetApi.runRiskEngine,
    onSuccess: (data) => {
      setRiskResult(data.message)
      toast.success(data.message)
    },
    onError: () => toast.error('Risk engine run failed'),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadMutation.mutate(file)
  }

  const isRunning = simStatus?.running

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <PageHeader
        title="Data Management"
        subtitle="Upload datasets, control simulation, and manage the risk engine"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Simulation control */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-jade-500/10 border border-jade-500/20">
              <Zap size={16} className="text-jade-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-200">Wearable Simulator</h3>
              <p className="text-xs text-slate-500">Simulates Apple Watch-like vital data every 20–30 seconds</p>
            </div>
          </div>

          <div className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm',
            isRunning ? 'bg-jade-500/10 text-jade-400 border border-jade-500/20' : 'bg-navy-900 text-slate-500 border border-white/5'
          )}>
            <span className={clsx('w-2 h-2 rounded-full', isRunning ? 'bg-jade-400 live-dot' : 'bg-slate-600')} />
            {isRunning ? 'Simulation is running' : 'Simulation is stopped'}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => startSim.mutate()}
              disabled={isRunning || startSim.isPending}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
                isRunning
                  ? 'bg-navy-900 text-slate-600 border border-white/5 cursor-not-allowed'
                  : 'bg-jade-500/15 text-jade-400 border border-jade-500/20 hover:bg-jade-500/25'
              )}
            >
              {startSim.isPending ? <Spinner size={14} /> : <Play size={14} />}
              Start
            </button>
            <button
              onClick={() => stopSim.mutate()}
              disabled={!isRunning || stopSim.isPending}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
                !isRunning
                  ? 'bg-navy-900 text-slate-600 border border-white/5 cursor-not-allowed'
                  : 'bg-coral-500/15 text-coral-400 border border-coral-500/20 hover:bg-coral-500/25'
              )}
            >
              {stopSim.isPending ? <Spinner size={14} /> : <Square size={14} />}
              Stop
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-600">
              When running, vitals are generated every 20–30 seconds per patient. High-risk patients
              occasionally spike to critical values. Real-time updates are pushed via WebSocket.
            </p>
          </div>
        </div>

        {/* CSV Upload */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Upload size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-200">Upload Dataset</h3>
              <p className="text-xs text-slate-500">Import patient data from CSV file</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-white/20 transition-all group"
          >
            <Upload size={24} className="mx-auto mb-2 text-slate-600 group-hover:text-slate-400 transition-colors" />
            <p className="text-sm text-slate-400">Click to upload CSV</p>
            <p className="text-xs text-slate-600 mt-1">Columns: name, age, village, district, phone, pregnancy_week, expected_due_date, medical_conditions, emergency_contact</p>
          </div>

          {uploadMutation.isPending && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <Spinner size={14} /> Uploading…
            </div>
          )}
          {uploadResult && (
            <div className="mt-3 text-sm text-jade-400 bg-jade-500/10 border border-jade-500/20 rounded-lg px-3 py-2">
              ✓ {uploadResult.message}
            </div>
          )}
        </div>

        {/* Risk Engine */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-coral-500/10 border border-coral-500/20">
              <RefreshCw size={16} className="text-coral-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-200">Run Risk Engine</h3>
              <p className="text-xs text-slate-500">Recompute risk assessments for all patients</p>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            Runs the rule-based AI risk scoring engine on the latest vitals for every patient.
            Updates risk levels and generates new alerts where thresholds are crossed.
          </p>

          <button
            onClick={() => riskMutation.mutate()}
            disabled={riskMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {riskMutation.isPending ? <Spinner size={14} /> : <RefreshCw size={14} />}
            Run Risk Engine
          </button>

          {riskResult && (
            <div className="mt-3 text-sm text-jade-400 bg-jade-500/10 border border-jade-500/20 rounded-lg px-3 py-2">
              ✓ {riskResult}
            </div>
          )}
        </div>

        {/* CSV Format Guide */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Database size={16} className="text-amber-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-200">CSV Format Guide</h3>
          </div>
          <div className="bg-navy-900 rounded-lg p-4 font-mono text-xs text-slate-400 overflow-x-auto">
            <p className="text-slate-500 mb-2"># Required columns:</p>
            <p>name,age,village,district,phone,</p>
            <p>pregnancy_week,expected_due_date,</p>
            <p>medical_conditions,emergency_contact</p>
            <br />
            <p className="text-slate-500 mb-2"># Example row:</p>
            <p>Sunita Devi,24,Rampur,Varanasi,</p>
            <p>9811100001,32,2025-03-15,</p>
            <p>hypertension;anaemia,9811100002</p>
          </div>
          <p className="text-xs text-slate-600 mt-3">
            Separate multiple medical conditions with semicolons (;)
          </p>
        </div>
      </div>
    </div>
  )
}
