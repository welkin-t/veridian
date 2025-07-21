import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders Veridian Dashboard headline', () => {
    render(<App />)
    const headline = screen.getByText(/Veridian Dashboard/i)
    expect(headline).toBeInTheDocument()
  })

  it('renders sustainable cloud job scheduling description', () => {
    render(<App />)
    const description = screen.getByText(/Sustainable cloud job scheduling platform/i)
    expect(description).toBeInTheDocument()
  })
})
