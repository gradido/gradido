
#include "main.h"
#include <list>

std::list<Test*> gTests;

void fillTests()
{
	gTests.push_back(new TestTasks());
	//	gTests.push_back(new LoginTest());
}

int load() {
	fillTests();
	for (std::list<Test*>::iterator it = gTests.begin(); it != gTests.end(); it++)
	{
		if ((*it)->init()) printf("Fehler bei Init test: %s\n", (*it)->getName());
	}
	return 0;
}

int run()
{
	//printf("running tests\n");
	printf("running tests\n");
	for (std::list<Test*>::iterator it = gTests.begin(); it != gTests.end(); it++)
	{
		//printf("running: %s\n", it->getName());
		printf("running test: %s", (*it)->getName());
		if (!(*it)->test()) printf("success\n");
	}
	return 0;
}

void ende()
{
	for (std::list<Test*>::iterator it = gTests.begin(); it != gTests.end(); it++)
	{
		if (*it) {
			delete *it;
		}
		
	}
	gTests.clear();
}


int main(int argc, char** argv) 
{
	load();
	run();
	ende();
	return 42;
}