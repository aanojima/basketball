function calculateQuarticRoots(b, c, d, e)
{
    var fzero = parseFloat("0.0");
    var izero = parseInt("0");
    var coeff = new Array( fzero, fzero, fzero, fzero );
    var real  = new Array( fzero, fzero, fzero, fzero );
    var imag  = new Array( fzero, fzero, fzero, fzero );

    coeff[0] = parseFloat( e );
    coeff[1] = parseFloat( d );
    coeff[2] = parseFloat( c );
    coeff[3] = parseFloat( b );
    coeff[4] = parseFloat( "1.0" );

    var TOLERANCE = parseFloat( "0.00000001" );
    var LIMIT = parseInt( "50" );
    var beta1  = fzero; 
    var beta2  = fzero;
    var delta1 = fzero; 
    var delta2 = fzero; 
    var delta3 = fzero;
    
    var i = izero;
    var j = izero;
    var k = izero;

    var n  = parseInt( "4" );       // order
    var n1 = parseInt( "5" );
    var n2 = parseInt( "6" );

    var a = new Array( fzero, fzero, fzero, fzero );
    var b = new Array( fzero, fzero, fzero, fzero );
    var c = new Array( fzero, fzero, fzero, fzero );
    var d = new Array( fzero, fzero, fzero, fzero );
  
    // is the coefficient of the highest term zero?
    if( Math.abs( coeff[0] ) < TOLERANCE )
        return;

    for( i = 0; i <= n; i++ )      //  copy into working array
        a[n1-i] = coeff[i];    
    
    var count = izero;             // initialize root counter

    // start the main Lin-Bairstow iteration loop
    do
    {
        // initialize the counter and guesses for the
        // coefficients of quadratic factor:
        //
        // p(x) = x^2 + alfa1*x + beta1
        var alfa1 = Math.random() - 0.5; 
        var beta1 = Math.random() - 0.5;
        var limit = parseInt( "1000" );

        do
        {
            b[0] = 0;
            d[0] = 0;
            b[1] = 1;
            d[1] = 1;

            j = 1;
            k = 0;
       
            for( i = 2; i <= n1; i++ )
            {
                b[i] = a[i] - alfa1 * b[j] - beta1 * b[k];
                d[i] = b[i] - alfa1 * d[j] - beta1 * d[k];
                j = j + 1;
                k = k + 1;
            }
       
            j = n - 1;
            k = n - 2;
            delta1 = d[j] * d[j] - ( d[n] - b[n] ) * d[k];
            alfa2 = ( b[n] * d[j] - b[n1] * d[k] ) / delta1;
            beta2 = ( b[n1] * d[j] - ( d[n] - b[n] ) * b[n] ) / delta1;
            alfa1 = alfa1 + alfa2;
            beta1 = beta1 + beta2;

            if( --limit < 0 )         // cannot solve
                return;

            if( Math.abs( alfa2 ) < TOLERANCE && Math.abs( beta2 ) < TOLERANCE )
                break;
        }
        while( true );
        
        delta1 = alfa1*alfa1 - 4 * beta1;

        if( delta1 < 0 )              // imaginary roots
        {
            delta2 = Math.sqrt( Math.abs( delta1 ) ) / 2;
            delta3 = -alfa1 / 2;

            real[count]   =  delta3;
            imag[count]   =  delta2;
            
            real[count+1] =  delta3;
            imag[count+1] =  delta2;  // sign is inverted on display
        }     
        else                          // roots are real
        {
            delta2 = Math.sqrt( delta1 );
       
            real[count]   = ( delta2 - alfa1 ) / 2;
            imag[count]   = 0;

            real[count+1] = ( delta2 + alfa1 ) / ( -2 );
            imag[count+1] = 0;
        }     
     
        
        count = count + 2;            // update root counter

        n  = n  - 2;                  // reduce polynomial order
        n1 = n1 - 2;
        n2 = n2 - 2;

        // for n >= 2 calculate coefficients of
        //  the new polynomial
        if( n >= 2 )
        {
            for( i = 1; i <= n1; i++ )
                a[i] = b[i];
        }

        if( n < 2 ) break;
    }
    while( true );
  
    if( n == 1 )
    {
        // obtain last single real root
        real[count] = -b[2];
        imag[count] = 0;
    }  


    var realValue1 = real[0];
    var imagValue1 = imag[0];
    var realValue2 = real[1];
    var imagValue2 = -1 * imag[1];
    var realValue3 = real[2];
    var imagValue3 = imag[2];
    var realValue4 = real[3];
    var imagValue4 = -1 * imag[3];

    var output = [];
    for (var op = 0; op < 4; op++){
        var root = {
            "real" : real[op],
            "imag" : imag[op]
        };
        output.push(root);
    }

    return output;
}
