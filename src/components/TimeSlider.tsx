/**
 * Time Slider Component
 * Interactive slider for navigating through time-series energy demand data
 */

import './TimeSlider.css'

interface TimeSliderProps {
  minDate: Date
  maxDate: Date
  currentDate: Date
  onDateChange: (date: Date) => void
  stepSize?: 'hour' | 'day' | 'week' | 'month'
  className?: string
}

const TimeSlider = ({
  minDate,
  maxDate,
  currentDate,
  onDateChange,
  stepSize = 'day',
  className
}: TimeSliderProps) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    const totalMs = maxDate.getTime() - minDate.getTime()
    const newDate = new Date(minDate.getTime() + (totalMs * value) / 100)
    onDateChange(newDate)
  }

  const getCurrentPercentage = () => {
    const totalMs = maxDate.getTime() - minDate.getTime()
    const currentMs = currentDate.getTime() - minDate.getTime()
    return (currentMs / totalMs) * 100
  }

  const formatDate = (date: Date) => {
    switch (stepSize) {
      case 'hour':
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          hour12: true
        })
      case 'day':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      case 'week':
      case 'month':
        return date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        })
    }
  }

  return (
    <div className={`time-slider${className ? ` ${className}` : ''}`}>
      <div className="time-slider-header">
        <div className="time-display">
          {formatDate(currentDate)}
        </div>
      </div>

      <div className="slider-container">
        <input
          type="range"
          min="0"
          max="100"
          value={getCurrentPercentage()}
          onChange={handleSliderChange}
          className="slider"
        />
        <div className="slider-labels">
          <span className="slider-label">{formatDate(minDate)}</span>
          <span className="slider-label">{formatDate(maxDate)}</span>
        </div>
      </div>
    </div>
  )
}

export default TimeSlider
