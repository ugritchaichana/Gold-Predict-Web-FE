"use client"

import * as React from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
}

export const toastTimeouts = new Map()

const toastReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { id } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastTimeouts.has(id)) {
        clearTimeout(toastTimeouts.get(id))
        toastTimeouts.delete(id)
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === id || id === "all"
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.id === "all") {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      }
    default:
      return state
  }
}

const useToast = () => {
  const [state, dispatch] = React.useReducer(toastReducer, {
    toasts: [],
  })

  React.useEffect(() => {
    state.toasts.forEach((toast) => {
      if (toast.open) {
        return
      }

      if (toastTimeouts.has(toast.id)) {
        return
      }

      const timeout = setTimeout(() => {
        dispatch({ type: actionTypes.REMOVE_TOAST, id: toast.id })
      }, TOAST_REMOVE_DELAY)

      toastTimeouts.set(toast.id, timeout)
    })
  }, [state.toasts])

  const toast = React.useCallback(
    (props) => {
      const id = props.id || Math.random().toString(36).substring(2, 9)
      const update = (props) =>
        dispatch({
          type: actionTypes.UPDATE_TOAST,
          toast: { ...props, id },
        })
      const dismiss = () =>
        dispatch({ type: actionTypes.DISMISS_TOAST, id })

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) {
              dismiss()
            }
          },
        },
      })

      return {
        id,
        dismiss,
        update,
      }
    },
    [dispatch]
  )

  return {
    ...state,
    toast,
    dismiss: (id) => dispatch({ type: actionTypes.DISMISS_TOAST, id }),
  }
}

export { useToast }

const ToastContext = React.createContext({})

export const ToastProvider = ({ children }) => {
  const toastContext = useToast()

  return (
    <ToastContext.Provider value={toastContext}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToastContext = () => {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }
  return context
} 