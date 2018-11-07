#ifndef XSLT_H    // To make sure you don't declare the function more than once by including the header multiple times.
#define XSLT_H 

#include <string>

//#include <libxslt/xslt.h>
//#include <libxslt/transform.h>
//#include <libxslt/xsltutils.h>


using namespace std;

string ProcesorXSLT(const string style, const string xml);

#endif