"use client"

import { Button } from "./ui/button"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-4 w-4" />
    } else if (resolvedTheme === "dark") {
      return <Moon className="h-4 w-4" />
    } else {
      return <Sun className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    if (theme === "system") return "System"
    return theme === "dark" ? "Dark" : "Light"
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="transition-all duration-300 hover:scale-105"
      title={`Theme: ${getLabel()}`}
    >
      <div className="transition-transform duration-300 hover:rotate-12">
        {getIcon()}
      </div>
    </Button>
  )
}