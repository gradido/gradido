#include "MemoryPage.h"

#include "../SingletonManager/ErrorManager.h"

/*
unsigned char*	m_pObjectData;		//Zeiger auf den reservieretn Speicher
unsigned char**	m_ppFreeObjects;	//Zeiger auf die anderen Zeiger
Poco::UInt16	m_iNumObject;		//Anzahl der Objecte
Poco::UInt16	m_ibFreeOnDestroy;	//Weiß nicht
Poco::UInt16	m_iTop;				//Keine Ahnung
Poco::UInt16    m_size;
*/
MemoryPage::MemoryPage(Poco::UInt16 iNumObjects, Poco::UInt16 objectSize)
	: m_pObjectData(nullptr), m_ppFreeObjects(nullptr), m_iNumObject(iNumObjects), m_iTop(0), m_size(objectSize)
{
	//Fehler abfangen
	//ASSERT(iNumObjects > 0);
	//if (iNumObjects <= 0) LOG_ERROR_VOID("not enough objects ");

	//Speicher reservieren
	m_pObjectData = (unsigned char*)malloc(objectSize * iNumObjects);
	//m_pObjectData = new FLDataType[iNumObjects];
	m_ppFreeObjects = new unsigned char*[iNumObjects];

	//Checken ob der Speicher reserviert wurde
	//	ASSERT(m_pObjectData);
	//	ASSERT(m_ppFreeObjects);
//	if (!m_pObjectData || !m_ppFreeObjects) LOG_ERROR_VOID("Es konnte kein Speicher reserviert werden!");
	if (!m_pObjectData || !m_ppFreeObjects) {
		auto em = ErrorManager::getInstance();
		em->addError(new ParamError("MemoryPage", "error reserving memory, memory size:", std::to_string(objectSize * iNumObjects)));
		em->sendErrorsAsEmail();
		return;
	}

	//Zeiger zuweisen
	FillStack();


}


MemoryPage::~MemoryPage()
{
	if (m_pObjectData) {
		free(m_pObjectData);
		m_pObjectData = nullptr;
	}
	if (m_ppFreeObjects) {
		delete[] m_ppFreeObjects;
		m_ppFreeObjects = nullptr;
	}
	m_iNumObject = 0;
	m_iTop = 0;
}


//****************************************************************************++

void MemoryPage::FillStack()
{
	int iIndex = m_iNumObject - 1;

	//Die Zeiger in m_ppFreeObjects werden von vorne nach hinten,
	//von hinten nach vorne auf den reservierten Speicher ausgerichtet
	for (m_iTop = 0; m_iTop < m_iNumObject; m_iTop++)
	{
		m_ppFreeObjects[m_iTop] = &(m_pObjectData[iIndex--]);
	}
}

//*********************************************************************************

unsigned char* MemoryPage::NewInstance()
{
	//	ASSERT(m_iTop);
	if (m_iTop <= 0)
	{
		return nullptr;
		//LOG_ERROR("Kein Platz mehr in der Liste!", NULL);
	}
	return m_ppFreeObjects[--m_iTop];
}

//********************************************************************************

void MemoryPage::FreeInstance(unsigned char* pInstance)
{

	//Fehler kontrolle
	//	ASSERT(pInstance >= &(m_pObjectData[0]) &&
	//		   pInstance <  &(m_pObjectData[m_iNumObject]));
	//	ASSERT(m_iTop < m_iNumObject);

	m_ppFreeObjects[m_iTop++] = pInstance;
}
