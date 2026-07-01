// src/context/DayContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface DayContextType {
  dataRiferimento: Date;
  changeDate: (newDate: Date) => void;
}

export const DayContext = createContext<DayContextType | undefined>(undefined);

export const DayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataRiferimento, setDataRiferimento] = useState<Date>(new Date());
  return (
    <DayContext.Provider value={{ dataRiferimento, changeDate: setDataRiferimento }}>
      {children}
    </DayContext.Provider>
  );
};

export const useDayOptional = () => useContext(DayContext);
export const useDay = () => {
  const context = useContext(DayContext);
  if (!context) throw new Error("useDay deve essere usato all'interno di un DayProvider");
  return context;

};