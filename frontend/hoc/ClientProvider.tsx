"use client"

import { PersistGate } from 'redux-persist/integration/react'
import React, { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { persistStore } from 'redux-persist'
import store from '@/store/store'

const persistor = persistStore(store)

const ClientProvider = ({children}:{children:ReactNode}) => {
  return (
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            {children}
        </PersistGate>
    </Provider>
  )
}

export default ClientProvider