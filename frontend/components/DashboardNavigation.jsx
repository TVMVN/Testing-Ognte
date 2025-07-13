import React from 'react'

const DashboardNavigation = () => {
  return (
    <div>
              <Link href={`/dashboard/${username}`}>
        <div className="flex items-center mb-6 text-green-100 hover:text-green-300 z-10 relative">
          <ArrowLeft className="mr-2" />
          <span>Back to Dashboard</span>
        </div>
      </Link>
    </div>
  )
}

export default DashboardNavigation