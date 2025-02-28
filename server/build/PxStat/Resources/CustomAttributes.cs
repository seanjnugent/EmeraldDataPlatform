﻿using System;

namespace PxStat
{
    internal class NoCleanseDto : Attribute { }
    /// <summary>
    /// If an object contains contains a parameter with the NoHtmlStrip attribute then no HTML tags will be stripped when passed to the Sanitizer
    /// </summary>
    internal class NoHtmlStrip : Attribute { }

    /// <summary>
    /// If an object contains contains a parameter with the NoTrim attribute then no trimming will apply when passed to the Sanitizer
    /// </summary>
    internal class NoTrim : Attribute { }

    /// <summary>
    /// If an object contains a parameter with the LowerCase attribute then the value will be converted to lower case when passed to the Sanitizer
    /// </summary>
    internal class LowerCase : Attribute { }

    /// <summary>
    /// If an object contains a parameter with the UpperCase attribute then the value will be converted to upper case when passed to the Sanitizer
    /// </summary>
    internal class UpperCase : Attribute { }

    /// <summary>
    /// If this is asserted on an API, parameters will be cleansed on an individual basis
    /// All parameters will be cleansed except those with NoHtmlStrip on the corresponding DTO attribute
    /// </summary>
    internal class IndividualCleanseNoHtml : Attribute { }

    /// <summary>
    /// Do not sanitize this property in the BaseTemplate
    /// </summary>
    internal class DefaultSanitizer : Attribute { }

    /// <summary>
    /// If this attribute is asserted on an API method then calls to that method will not be traced
    /// </summary>
    internal class NoTrace : Attribute { }

    /// <summary>
    /// If this attribute is asserted on an API method then calls to that method will be logged in the Analytic table
    /// </summary>
    internal class Analytic : Attribute { }

    /// <summary>
    /// If this attribute is asserted on an API method then the call is subject to throttling in case of usage limits being broken
    /// </summary>
    internal class Throttle : Attribute { }

    /// <summary>
    ///This checks for the AllowAPICall attribute
    ///Asserting this attribute means that a public method can be called by the API
    /// </summary>
    internal class AllowAPICall : Attribute { }

    /// <summary>
    /// Allows a HEAD http call
    /// When this is asserted on a method, the method may be called with a HEAD. This assumes the pxstat method can handle the HEAD request.
    /// </summary>
    internal class AllowHEADrequest : Attribute { }

    /// <summary>
    /// If this attribute is asserted then (a) the operation will search the cache before attempting a Read, and (b) any Read operation will be cached
    /// The CAS_REPOSITORY may need to be qualified by a DOMAIN. This is typically a DTO proprty. Include the proprty name if this needs to form part 
    /// of the name of the cas repository as well.
    /// </summary>
    internal class CacheRead : Attribute
    {
        public virtual string CAS_REPOSITORY { get; set; }
        public virtual string DOMAIN { get; set; }

        //The returned object property who's contents will define the expiry time of the cache
        public virtual string EXPIRY_DATE_TIME_PROPERTY { get; set; }
    }

    /// <summary>
    /// If this attribute is asserted then the relevant cache will be flushed. Separate the Cas values with a comma if multiple caches need to be flushed.
    /// If the cache name needs to be qualified with a property name as well, then they should also be part of a comma separated list. Make sure to keep 
    /// corresponding pairs in order. If no domain is required then use an empty string "" in order to keep the list coherent.
    /// </summary>
    internal class CacheFlush : Attribute
    {
        public virtual string CAS_REPOSITORY_DOMAIN_LIST { get; set; }
        public virtual string DOMAIN { get; set; }
    }


    /// <summary>
    /// If this attribute is asserted, the DTO will need to contain the following parameters:
    /// - Ccnusername - a valid user name
    /// - AprToken - a token shown to the user on the TM_APPLICATION_USER table
    /// - Also, the relevant AppCode must be (a) shown on the API call and (b) shown against the CcnUsername on the TM_APPLICATION_USER table
    /// </summary>
    internal class TokenSecure : Attribute 
    { 
        public virtual string AppCode { get; set; }
    }

    /// <summary>
    /// Method not allowed for PowerUsers and below if the security.demo flag is set in the global config
    /// </summary>
    internal class NoDemo : Attribute { }
}
