/*/*************************************************************************
 *                                                                         *
 * Core, Core-Lib for my programs, Core doesn't need any libraries	   *
 * Copyright (C) 2012, 2013, 2014 Dario Rekowski                           *
 * Email: ***REMOVED***   Web: ***REMOVED***                *
 *                                                                         *
 * This program is free software: you can redistribute it and/or modify    *
 * it under the terms of the GNU General Public License as published by    *
 * the Free Software Foundation, either version 3 of the License, or       *
 * any later version.                                                      *
 *									   *
 * This program is distributed in the hope that it will be useful,	   *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of	   *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the	   *
 * GNU General Public License for more details.				   *
 *									   *
 * You should have received a copy of the GNU General Public License	   *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
 *                                                                         *
 ***************************************************************************/

/*
Speichermanager mit Free Listen
Damit man häufig Speicher reservieren kann ohne den
Speicher zu defragmentieren.
Nach einem Artikel aus Gems4: "Speicherfragmentierung mit Templated Free-Lists bekämmpfen"
von Paul Glinker Rockstar Games Toronto

  Programmierer: Dario Rekowski
*/
//DRLogger Log;
//Deklaration
//#ifdef _TEMPLATEFREE_
#ifndef __DR_CORE2_MEMORY_LIST__
#define __DR_CORE2_MEMORY_LIST__


template <typename FLDataType> class DRMemoryList
{

	public:
		//Standard Konstruktor
		DRMemoryList(int iNumObjects);

		//Konstruktor für Daten ohne Standard Konstruktor
		DRMemoryList(FLDataType* pObjectData, FLDataType** ppFreeObjects, int iNumObjects);

		//Deskonstruktor, wichtig!!
		~DRMemoryList();

		//füllt den Zeigerstack (Stapel)
		void FillStack();

		//Liefert den Zeiger auf einen freien Spiecherplatz zurück
		FLDataType* NewInstance();

		//Und die Instance freigeben
		void FreeInstance(FLDataType* pInstance);
                
		//liefert die anzahl der noch freien Speicherplätze zurück
		int getFreeCount() {return m_iTop;}
		int getObjectCount() {return m_iNumObject;}
		FLDataType** getDataPointer() {return m_ppFreeObjects;}

	private:
		FLDataType*		m_pObjectData;		//Zeiger auf den reservieretn Speicher
		FLDataType**	m_ppFreeObjects;	//Zeiger auf die anderen Zeiger
		int				m_iNumObject;		//Anzahl der Objecte
		bool			m_bFreeOnDestroy;	//Weiß nicht
		int				m_iTop;				//Keine Ahnung
};


//******************************************************************************++
//Funktionen
template <typename FLDataType> DRMemoryList<FLDataType>::DRMemoryList(int iNumObjects)
{
	//Fehler abfangen
	//ASSERT(iNumObjects > 0);
	if(iNumObjects <= 0) LOG_ERROR_VOID("not enough objects ");

	//Speicher reservieren
	m_pObjectData = new FLDataType[iNumObjects];
	m_ppFreeObjects = new FLDataType*[iNumObjects];

	//Checken ob der Speicher reserviert wurde
//	ASSERT(m_pObjectData);
//	ASSERT(m_ppFreeObjects);
	if(!m_pObjectData || !m_ppFreeObjects) LOG_ERROR_VOID("Es konnte kein Speicher reserviert werden!");


	//Anzahl zuweisen
	m_iNumObject = iNumObjects;

	m_bFreeOnDestroy = true;

	//Zeiger zuweisen
	FillStack();


}

//------------------------------------------------------------------------------------

template <typename FLDataType> DRMemoryList<FLDataType>::DRMemoryList(FLDataType* pObjectData, FLDataType** ppFreeObjects, int iNumObjects)
{
		//Fehler abfangen
//	ASSERT(iNumObjects > 0);
	if(iNumObjects <= 0) LOG_ERROR_VOID("not enough objects ");


	//Speicher reservieren
	m_pObjectData = pObjectData;
	m_ppFreeObjects = ppFreeObjects;

	//Checken ob der Speicher reserviert wurde
//	ASSERT(m_pObjectData);
//	ASSERT(m_ppFreeObjects);
	if(!m_pObjectData || !m_ppFreeObjects) LOG_ERROR_VOID("Es konnte kein Speicher reserviert werden!");


	//Anzahl zuweisen
	m_iNumObject = iNumObjects;

	m_bFreeOnDestroy = false;

	//Zeiger zuweisen
	FillStack();


}

//---------------------------------------------------------------------------------------------
template <typename FLDataType> DRMemoryList<FLDataType>::~DRMemoryList()
{
    DR_SAVE_DELETE_ARRAY(m_pObjectData);
    DR_SAVE_DELETE_ARRAY(m_ppFreeObjects);
}


//****************************************************************************++

template <typename FLDataType> void DRMemoryList<FLDataType>::FillStack()
{
	int iIndex = m_iNumObject - 1;

	//Die Zeiger in m_ppFreeObjects werden von vorne nach hinten,
	//von hinten nach vorne auf den reservierten Speicher ausgerichtet
	for(m_iTop = 0; m_iTop < m_iNumObject; m_iTop++)
	{
		m_ppFreeObjects[m_iTop] = &(m_pObjectData[iIndex--]);
	}
}

//*********************************************************************************

template <typename FLDataType> FLDataType* DRMemoryList<FLDataType>::NewInstance()
{
//	ASSERT(m_iTop);
	if(m_iTop <= 0)
	{
                LOG_ERROR("Kein Platz mehr in der Liste!", NULL);
	}
	return m_ppFreeObjects[--m_iTop];
}

//********************************************************************************

template <typename FLDataType> void DRMemoryList<FLDataType>::FreeInstance(FLDataType* pInstance)
{
	
	//Fehler kontrolle
//	ASSERT(pInstance >= &(m_pObjectData[0]) &&
//		   pInstance <  &(m_pObjectData[m_iNumObject]));
//	ASSERT(m_iTop < m_iNumObject);

	m_ppFreeObjects[m_iTop++] = pInstance;
}

#endif //__DR_CORE2_MEMORY_LIST__
//#endif //_TEMPLATEFREE_